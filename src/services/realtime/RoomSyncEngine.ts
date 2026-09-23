import { RoomMember, ChatMessage, FloatingReaction, QueueItem, Song, MemberRole } from '../../types';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { SupabaseDbService } from '../supabase/db';
import { getDiceBearAvatar } from '../../utils/avatar';
import { audioManager } from '../audio/AudioManager';
import { isDuplicateTrack } from '../audio/SongNormalization';

export interface SyncPlaybackPayload {
  songId: string;
  song?: Song;            // Full Song object for instant track-switch syncing
  isPlaying: boolean;
  position: number;
  startedAt: number;      // epoch ms when playback began/resumed
  pausedAt: number;       // position in seconds when paused
  syncedAt: number;       // UTC timestamp ms
  queuePosition: number;
  senderId: string;
  senderRole?: MemberRole;
}

export interface RoomSyncEventHandlers {
  onPlaybackSync?: (payload: SyncPlaybackPayload) => void;
  onChatMessage?: (msg: ChatMessage) => void;
  onReaction?: (reaction: FloatingReaction) => void;
  onPresenceUpdate?: (members: RoomMember[]) => void;
  onQueueUpdate?: (queue: QueueItem[]) => void;
  onHostChanged?: (newHost: RoomMember) => void;
}

export class RoomSyncEngine {
  private roomId: string;
  private currentUserId: string;
  private currentUserRole: MemberRole = 'member';
  private currentHostId: string = '';
  private handlers: RoomSyncEventHandlers = {};
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private members: RoomMember[] = [];
  private queue: QueueItem[] = [];

  constructor(roomId: string, currentUserId: string, currentUserRole: MemberRole = 'member', initialHostId = '') {
    this.roomId = roomId;
    this.currentUserId = currentUserId;
    this.currentUserRole = currentUserRole;
    this.currentHostId = initialHostId || (currentUserRole === 'owner' ? currentUserId : '');
  }

  public getRole(): MemberRole {
    return this.currentUserRole;
  }

  public isHost(): boolean {
    return this.currentUserRole === 'owner' || this.currentUserRole === 'dj';
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !this.isHost()) {
      // Re-synchronize immediately when returning to tab
      this.requestPlaybackSync();
    }
  };

  private handleReconnect = () => {
    if (!this.isHost()) {
      this.requestPlaybackSync();
    }
  };

  public async connect(handlers: RoomSyncEventHandlers) {
    this.handlers = handlers;

    // 1. Fetch real persistent messages from Supabase PostgreSQL
    try {
      const realMsgs = await SupabaseDbService.fetchMessages(this.roomId);
      realMsgs.forEach((m) => this.handlers.onChatMessage?.(m));
    } catch (e) {
      console.warn('Real message load notice:', e);
    }

    // 2. Fetch real queue from Supabase PostgreSQL
    try {
      const realQueue = await SupabaseDbService.fetchQueue(this.roomId);
      if (realQueue.length > 0) {
        this.queue = realQueue;
        this.handlers.onQueueUpdate?.(this.queue);
      }
    } catch (e) {
      console.warn('Real queue load notice:', e);
    }

    // 3. Browser BroadcastChannel for instant cross-tab synchronization
    try {
      this.broadcastChannel = new BroadcastChannel(`chillwithyt_room_${this.roomId}`);
      this.broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'SYNC_PLAYBACK' && payload.senderId !== this.currentUserId) {
          this.handleIncomingPlaybackSync(payload);
        } else if (type === 'REQUEST_PLAYBACK_SYNC' && this.isHost()) {
          this.sendAuthoritativeSyncResponse();
        } else if (type === 'CHAT_MESSAGE') {
          this.handlers.onChatMessage?.(payload);
        } else if (type === 'REACTION') {
          this.handlers.onReaction?.(payload);
        } else if (type === 'QUEUE_UPDATE') {
          this.queue = payload;
          this.handlers.onQueueUpdate?.(this.queue);
        } else if (type === 'HOST_CHANGED') {
          this.currentHostId = payload.userId;
          if (payload.userId === this.currentUserId) {
            this.currentUserRole = 'owner';
            this.startHostHeartbeat();
          }
          this.handlers.onHostChanged?.(payload);
        }
      };
    } catch {
      // BroadcastChannel fallback
    }

    // 4. Real Supabase Realtime Channel: broadcast, presence & postgres changes
    if (isSupabaseConfigured && supabase) {
      try {
        this.supabaseChannel = supabase.channel(`room:${this.roomId}`, {
          config: {
            presence: { key: this.currentUserId },
          },
        });

        this.supabaseChannel
          .on('broadcast', { event: 'playback' }, ({ payload }: { payload: SyncPlaybackPayload }) => {
            if (payload.senderId !== this.currentUserId) {
              this.handleIncomingPlaybackSync(payload);
            }
          })
          .on('broadcast', { event: 'request_sync' }, () => {
            if (this.isHost()) {
              this.sendAuthoritativeSyncResponse();
            }
          })
          .on('broadcast', { event: 'reaction' }, ({ payload }: { payload: FloatingReaction }) => {
            this.handlers.onReaction?.(payload);
          })
          .on('broadcast', { event: 'chat' }, ({ payload }: { payload: ChatMessage }) => {
            this.handlers.onChatMessage?.(payload);
          })
          .on('broadcast', { event: 'queue' }, ({ payload }: { payload: QueueItem[] }) => {
            this.queue = payload;
            this.handlers.onQueueUpdate?.(this.queue);
          })
          .on('broadcast', { event: 'host_changed' }, ({ payload }: { payload: RoomMember }) => {
            this.currentHostId = payload.userId;
            if (payload.userId === this.currentUserId) {
              this.currentUserRole = 'owner';
              this.startHostHeartbeat();
            }
            this.handlers.onHostChanged?.(payload);
          })
          .on('presence', { event: 'sync' }, () => {
            const state = this.supabaseChannel.presenceState();
            const onlineMembers: RoomMember[] = Object.keys(state).map((userId) => {
              const info = (state[userId] as any[])?.[0] || {};
              return {
                userId,
                username: info.username || 'user',
                displayName: info.displayName || 'Chiller',
                avatarUrl: info.avatarUrl || getDiceBearAvatar(userId),
                role: info.role || 'member',
                isOnline: true,
                joinedAt: info.online_at || new Date().toISOString(),
                isListening: true,
              };
            });

            if (onlineMembers.length > 0) {
              this.members = onlineMembers;
              this.handlers.onPresenceUpdate?.(onlineMembers);
              this.checkAndReassignHost(onlineMembers);
            }
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
              await this.supabaseChannel.track({
                username: this.currentUserId.slice(0, 8),
                displayName: 'Current User',
                role: this.currentUserRole,
                online_at: new Date().toISOString(),
              });
            }
          });
      } catch (e) {
        console.warn('Supabase realtime channel error:', e);
      }
    }

    // 5. Start Host Authoritative Heartbeat or Listener Sync Request
    if (this.isHost()) {
      this.startHostHeartbeat();
    } else {
      // Immediate sync request
      this.requestPlaybackSync();
      // Retry once after 600ms in case the host was in the middle of connecting
      setTimeout(() => {
        if (!this.isHost()) this.requestPlaybackSync();
      }, 600);
    }

    // 6. Listen for tab visibility & online changes for seamless reconnect sync
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleReconnect);
    }
  }

  /**
   * Automatic Host Reassignment when Host leaves
   */
  private checkAndReassignHost(onlineMembers: RoomMember[]) {
    if (!onlineMembers.length) return;

    // Check if the current host is still in the room
    const hostOnline = onlineMembers.some((m) => m.userId === this.currentHostId);

    if (!hostOnline && onlineMembers.length > 0) {
      // Elect earliest joined member as new host
      const sorted = [...onlineMembers].sort(
        (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
      );
      const newHost = sorted[0];
      this.currentHostId = newHost.userId;

      if (newHost.userId === this.currentUserId) {
        this.currentUserRole = 'owner';
        this.startHostHeartbeat();
      }

      this.handlers.onHostChanged?.(newHost);

      // Broadcast host change notice
      const hostChangeNotice: ChatMessage = {
        id: `sys-host-${Date.now()}`,
        roomId: this.roomId,
        user: {
          id: 'system',
          username: 'system',
          displayName: 'ChillWithYT System',
          avatarUrl: '/icon.png',
        },
        content: `👑 ${newHost.displayName} is now the Room Host`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      };

      this.handlers.onChatMessage?.(hostChangeNotice);

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'HOST_CHANGED', payload: newHost });
        this.broadcastChannel.postMessage({ type: 'CHAT_MESSAGE', payload: hostChangeNotice });
      }

      if (this.supabaseChannel) {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'host_changed',
          payload: newHost,
        });
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'chat',
          payload: hostChangeNotice,
        });
      }
    }
  }

  public disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleReconnect);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.supabaseChannel && supabase) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }
  }

  /**
   * Request live playback state from the room host (for late joiners or reconnects)
   */
  public requestPlaybackSync() {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'REQUEST_PLAYBACK_SYNC' });
    }
    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'request_sync',
        payload: { requesterId: this.currentUserId },
      });
    }
  }

  /**
   * Host replies to sync request with authoritative current playback state
   */
  public sendAuthoritativeSyncResponse() {
    if (!this.isHost()) return;
    const state = audioManager.getState();
    if (!state.currentSong) return;

    this.broadcastPlayback(
      state.isPlaying,
      state.currentSong.id,
      state.currentTime,
      state.queueIndex,
      state.currentSong
    );
  }

  /**
   * Host continuous heartbeat to keep all listeners lockstep in sync
   */
  private startHostHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.isHost()) {
        const state = audioManager.getState();
        if (state.currentSong && state.isPlaying) {
          this.broadcastPlayback(
            true,
            state.currentSong.id,
            state.currentTime,
            state.queueIndex,
            state.currentSong
          );
        }
      }
    }, 3000);
  }

  /**
   * Server-authoritative playback broadcast (Host/DJ controlled)
   */
  public broadcastPlayback(
    isPlaying: boolean,
    songId: string,
    position: number,
    queuePosition: number,
    song?: Song
  ) {
    // Only host or DJ can broadcast authoritative playback
    if (!this.isHost()) {
      return;
    }

    const now = Date.now();
    const payload: SyncPlaybackPayload = {
      songId,
      song: song || audioManager.getState().currentSong || undefined,
      isPlaying,
      position,
      startedAt: isPlaying ? now - Math.round(position * 1000) : now,
      pausedAt: position,
      syncedAt: now,
      queuePosition,
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'SYNC_PLAYBACK', payload });
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'playback',
        payload,
      });
    }
  }

  public broadcastReaction(emoji: string, userDisplayName?: string) {
    const reaction: FloatingReaction = {
      id: `react-${Date.now()}-${Math.random()}`,
      emoji,
      xOffset: 20 + Math.random() * 60,
      user: userDisplayName,
    };

    this.handlers.onReaction?.(reaction);

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'REACTION', payload: reaction });
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'reaction',
        payload: reaction,
      });
    }
  }

  public async sendChatMessage(content: string, user: RoomMember, songRef?: Song, replyTo?: ChatMessage['replyTo']) {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      roomId: this.roomId,
      user: {
        id: user.userId,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      songRef,
      replyTo,
    };

    this.handlers.onChatMessage?.(message);

    // Save to real Supabase PostgreSQL
    SupabaseDbService.sendMessage(this.roomId, user.userId, content, songRef).catch(() => {});

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'CHAT_MESSAGE', payload: message });
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'chat',
        payload: message,
      });
    }
  }

  public async addSongToQueue(song: Song, addedByUser: { id: string; username: string; avatarUrl: string }): Promise<boolean> {
    // 1. Prevent duplicate songs in queue
    const isDuplicate = this.queue.some((q) => isDuplicateTrack(q.song, song));
    if (isDuplicate) {
      return false;
    }

    // 2. Prevent spam: max 8 queued songs by the same user
    const userQueuedCount = this.queue.filter((q) => q.addedBy.id === addedByUser.id).length;
    if (userQueuedCount >= 8 && !this.isHost()) {
      return false;
    }

    const newItem: QueueItem = {
      id: `qi-${Date.now()}`,
      song,
      addedBy: addedByUser,
      addedAt: Date.now(),
      votes: { skip: 0, keep: 1, userVote: 'keep' },
    };

    this.queue.push(newItem);
    this.handlers.onQueueUpdate?.([...this.queue]);

    // Save to real Supabase PostgreSQL room_queue
    SupabaseDbService.addToQueue(this.roomId, song, addedByUser.id, this.queue.length).catch(() => {});

    // Send announcement to chat
    const sysMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      roomId: this.roomId,
      user: {
        id: addedByUser.id,
        username: addedByUser.username,
        displayName: addedByUser.username,
        avatarUrl: addedByUser.avatarUrl,
      },
      content: `queued ${song.title}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      songRef: song,
      isSystem: true,
    };
    this.handlers.onChatMessage?.(sysMsg);

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'QUEUE_UPDATE', payload: this.queue });
      this.broadcastChannel.postMessage({ type: 'CHAT_MESSAGE', payload: sysMsg });
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'queue',
        payload: this.queue,
      });
    }

    return true;
  }

  public voteQueueSong(queueItemId: string, voteType: 'skip' | 'keep') {
    const item = this.queue.find((q) => q.id === queueItemId);
    if (!item) return;

    if (item.votes.userVote === voteType) {
      item.votes[voteType]--;
      item.votes.userVote = undefined;
    } else {
      if (item.votes.userVote) {
        item.votes[item.votes.userVote]--;
      }
      item.votes[voteType]++;
      item.votes.userVote = voteType;
    }

    this.handlers.onQueueUpdate?.([...this.queue]);

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'QUEUE_UPDATE', payload: this.queue });
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'queue',
        payload: this.queue,
      });
    }
  }

  public removeQueueSong(queueItemId: string) {
    this.queue = this.queue.filter((q) => q.id !== queueItemId);
    this.handlers.onQueueUpdate?.([...this.queue]);

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'QUEUE_UPDATE', payload: this.queue });
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'queue',
        payload: this.queue,
      });
    }
  }

  public clearQueue() {
    this.queue = [];
    this.handlers.onQueueUpdate?.([]);

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'QUEUE_UPDATE', payload: [] });
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'queue',
        payload: [],
      });
    }
  }

  /**
   * Server-authoritative timestamp drift correction & track-switch syncing
   */
  private handleIncomingPlaybackSync(payload: SyncPlaybackPayload) {
    // If we are the room host, we are the authority and never override our own timeline
    if (this.isHost()) {
      return;
    }

    const now = Date.now();
    let expectedPosition = payload.position;
    if (payload.isPlaying) {
      // Calculate true position taking into account elapsed ms since the sync packet was transmitted
      const elapsedSinceSync = Math.max(0, (now - payload.syncedAt) / 1000);
      expectedPosition = payload.position + elapsedSinceSync;
    } else {
      expectedPosition = payload.pausedAt || payload.position;
    }

    const state = audioManager.getState();

    // 1. If host switched to a new song, switch listener's active song immediately at expectedPosition
    if (payload.songId && state.currentSong?.id !== payload.songId) {
      const targetSong = payload.song || state.queue.find((s) => s.id === payload.songId);
      if (targetSong) {
        audioManager.playSong(targetSong, undefined, expectedPosition);
        this.handlers.onPlaybackSync?.(payload);
        return;
      }
    }

    // 2. Align play/pause state
    if (payload.isPlaying && !state.isPlaying) {
      audioManager.play();
    } else if (!payload.isPlaying && state.isPlaying) {
      audioManager.pause();
    }

    // 3. Drift correction: seek only if drift exceeds 1.5 seconds (prevents jitter oscillations)
    const currentPos = state.currentTime;
    const drift = Math.abs(currentPos - expectedPosition);

    if (drift > 1.5) {
      audioManager.seek(expectedPosition);
    }

    this.handlers.onPlaybackSync?.(payload);
  }
}
