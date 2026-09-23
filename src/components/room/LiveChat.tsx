import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, RoomMember, Song } from '../../types';
import {
  Send,
  Smile,
  CornerUpLeft,
  Plus,
  Music,
  Play,
  X,
  Heart,
  Flame,
  Sparkles,
  ArrowLeft,
  Share2,
  Check,
  Rocket,
  ThumbsUp,
  Zap,
  Star,
  Coffee,
  Disc3,
  SkipForward
} from 'lucide-react';
import { audioManager } from '../../services/audio/AudioManager';
import { YouTubePlayerService } from '../../services/audio/YouTubePlayer';
import { resolveAvatar } from '../../utils/avatar';
import { SecurityGuard } from '../../services/security/SecurityGuard';
import { ArtworkImage } from '../../utils/artwork';

interface LiveChatProps {
  messages: ChatMessage[];
  currentMember: RoomMember;
  currentSong?: Song | null;
  onSendMessage: (text: string, songRef?: Song, replyTo?: ChatMessage['replyTo']) => void;
  onSendReaction: (emoji: string) => void;
  onQueueSong?: (song: Song) => void;
  onBackToMusic?: () => void;
}

const QUICK_REACTIONS = [
  { id: 'heart', label: 'Love', icon: Heart, color: 'text-rose-500 hover:text-rose-400 fill-rose-500/20 hover:bg-rose-500/10' },
  { id: 'fire', label: 'Fire', icon: Flame, color: 'text-amber-500 hover:text-amber-400 fill-amber-500/20 hover:bg-amber-500/10' },
  { id: 'sparkles', label: 'Vibe', icon: Sparkles, color: 'text-yellow-400 hover:text-yellow-300 fill-yellow-400/20 hover:bg-yellow-400/10' },
  { id: 'rocket', label: 'Banger', icon: Rocket, color: 'text-indigo-400 hover:text-indigo-300 fill-indigo-400/20 hover:bg-indigo-400/10' },
  { id: 'thumbsup', label: 'Clap', icon: ThumbsUp, color: 'text-emerald-400 hover:text-emerald-300 fill-emerald-400/20 hover:bg-emerald-400/10' },
  { id: 'music', label: 'Tune', icon: Music, color: 'text-pink-400 hover:text-pink-300 fill-pink-400/20 hover:bg-pink-400/10' },
  { id: 'zap', label: 'Energy', icon: Zap, color: 'text-cyan-400 hover:text-cyan-300 fill-cyan-400/20 hover:bg-cyan-400/10' },
  { id: 'star', label: 'Star', icon: Star, color: 'text-amber-400 hover:text-amber-300 fill-amber-400/20 hover:bg-amber-400/10' },
];

const VIBE_PRESETS = [
  { label: 'Fire beat', text: 'This beat is insane!', icon: Flame },
  { label: 'Pure vibe', text: 'Pure vibe right now.', icon: Sparkles },
  { label: 'Certified banger', text: 'Absolute banger of a track!', icon: Rocket },
  { label: 'Who picked this?', text: 'Who queued this gem?', icon: Disc3 },
  { label: 'Loving this', text: 'Loving this track!', icon: Heart },
  { label: 'Chill mode', text: 'Cozy late night chill.', icon: Coffee },
  { label: 'Next song?', text: 'Ready for the next one in queue.', icon: SkipForward },
];

export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  currentMember,
  currentSong,
  onSendMessage,
  onSendReaction,
  onQueueSong,
  onBackToMusic,
}) => {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [doubleTapHeartId, setDoubleTapHeartId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTapRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  const handleSubmit = async (e?: React.FormEvent, customText?: string, customSongRef?: Song) => {
    if (e) e.preventDefault();
    const textToSend = (customText !== undefined ? customText : inputText).trim();
    if (!textToSend && !customSongRef) return;

    // Rate Limiting Flood Protection (Max 5 messages per 4 seconds)
    const rateCheck = SecurityGuard.checkRateLimit(`chat_${currentMember.userId || 'anon'}`, 5, 4000);
    if (!rateCheck.allowed) {
      const waitSec = Math.ceil(rateCheck.remainingCooldownMs / 1000);
      setRateLimitWarning(`Please slow down! Cooldown active for ${waitSec}s.`);
      setTimeout(() => setRateLimitWarning(null), 3000);
      return;
    }

    // XSS Sanitization & length cap
    const sanitizedText = SecurityGuard.sanitizeText(textToSend || 'Shared a track', 400);
    if (!sanitizedText && !customSongRef) return;

    let songRef: Song | undefined = customSongRef;

    // Detect YouTube link if no customSongRef provided
    if (!songRef && textToSend) {
      const ytId = YouTubePlayerService.extractVideoId(textToSend);
      if (ytId && SecurityGuard.isValidYouTubeVideoId(ytId)) {
        try {
          const meta = await YouTubePlayerService.fetchYouTubeMetadata(ytId);
          songRef = {
            id: `yt-${ytId}`,
            source: 'youtube',
            sourceId: ytId,
            title: SecurityGuard.sanitizeText(meta.title, 100),
            artist: SecurityGuard.sanitizeText(meta.artist, 60),
            artwork: SecurityGuard.sanitizeUrl(meta.artwork),
            duration: meta.duration,
            tags: ['YouTube', 'Live Shared'],
          };
        } catch (err) {
          console.warn('Could not fetch YouTube metadata for chat link:', err);
        }
      }
    }

    onSendMessage(
      sanitizedText,
      songRef,
      replyingTo
        ? {
            id: replyingTo.id,
            username: SecurityGuard.sanitizeText(replyingTo.user.displayName || replyingTo.user.username, 30),
            content: SecurityGuard.sanitizeText(replyingTo.content, 120),
          }
        : undefined
    );

    if (customText === undefined) {
      setInputText('');
    }
    setReplyingTo(null);
  };

  const handleShareCurrentSong = () => {
    if (!currentSong) return;
    handleSubmit(
      undefined,
      `Listening to "${currentSong.title}" by ${currentSong.artist}`,
      currentSong
    );
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const handleMessageDoubleTap = (msgId: string) => {
    const now = Date.now();
    if (lastTapRef.current.id === msgId && now - lastTapRef.current.time < 350) {
      // Double tap detected!
      onSendReaction('heart');
      setDoubleTapHeartId(msgId);
      setTimeout(() => setDoubleTapHeartId(null), 1200);
      lastTapRef.current = { id: '', time: 0 };
    } else {
      lastTapRef.current = { id: msgId, time: now };
    }
  };

  const handlePlaySongPill = (song: Song) => {
    audioManager.playSong(song);
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] select-none overflow-hidden relative">
      {/* Chat Sub-Header */}
      <div className="px-3 sm:px-4 py-2 bg-[#1C1C1C] border-b border-[#2B2B2B] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {onBackToMusic && (
            <button
              onClick={onBackToMusic}
              className="p-1 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition md:hidden cursor-pointer"
              title="Return to music"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide">Live Room Chat</span>
          <span className="text-[10px] text-[#717171] font-mono">({messages.length})</span>
        </div>

        {/* Quick Current Song Share Button */}
        {currentSong && (
          <button
            onClick={handleShareCurrentSong}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition active:scale-95 cursor-pointer ${
              shareSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#272727] hover:bg-[#333333] text-[#AAAAAA] hover:text-white border border-[#383838]'
            }`}
            title="Share currently playing track in chat"
          >
            {shareSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Shared</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3 text-[#FF4D4D]" />
                <span className="hidden sm:inline">Share Song</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#717171] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#212121] flex items-center justify-center border border-[#2B2B2B]">
              <Music className="w-6 h-6 text-[#FF4D4D]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">No messages yet</p>
              <p className="text-[11px] text-[#717171] mt-0.5 max-w-xs">
                Say hi, send a vibe, or paste a YouTube link to listen together with the room!
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.isSystem || msg.user.id === 'system') {
            return (
              <div key={msg.id} className="text-center my-2 animate-fade-in">
                <span className="text-[10px] bg-[#212121] text-[#AAAAAA] px-3 py-1 rounded-full border border-[#2B2B2B] inline-block font-mono">
                  {msg.content}
                </span>
                {msg.songRef && (
                  <div className="mt-2 inline-flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] shadow-sm max-w-xs">
                    <ArtworkImage
                      song={msg.songRef}
                      alt={msg.songRef.title}
                      className="w-7 h-7 rounded-md object-cover"
                    />
                    <div className="text-left overflow-hidden min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate">{msg.songRef.title}</p>
                      <p className="text-[9px] text-[#717171] truncate">{msg.songRef.artist}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        onClick={() => handlePlaySongPill(msg.songRef!)}
                        className="p-1 rounded-md bg-[#FF0000] text-white hover:bg-[#CC0000] transition cursor-pointer"
                        title="Play in Room"
                      >
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </button>
                      {onQueueSong && (
                        <button
                          onClick={() => onQueueSong(msg.songRef!)}
                          className="p-1 rounded-md bg-[#272727] text-[#AAAAAA] hover:text-white transition cursor-pointer"
                          title="Queue song"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const isMe = msg.user.id === currentMember.userId || msg.user.username === currentMember.username;

          return (
            <div
              key={msg.id}
              onClick={() => handleMessageDoubleTap(msg.id)}
              className={`group flex gap-2.5 animate-fade-in relative transition ${
                isMe ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Double-tap Floating Heart Animation */}
              {doubleTapHeartId === msg.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping">
                  <Heart className="w-10 h-10 text-rose-500 fill-rose-500 drop-shadow-[0_0_16px_rgba(244,63,94,0.9)]" />
                </div>
              )}

              <img
                src={resolveAvatar(msg.user.avatarUrl, msg.user.username || msg.user.id)}
                alt={msg.user.username}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-white/10 shrink-0 mt-0.5 shadow-sm"
              />

              <div className={`flex-1 min-w-0 max-w-[85%] sm:max-w-[80%] ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                {/* User & Time header */}
                <div className={`flex items-baseline gap-1.5 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs font-semibold text-white hover:underline cursor-pointer">
                    {isMe ? 'You' : msg.user.displayName || msg.user.username}
                  </span>
                  {msg.user.role === 'owner' && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/30">
                      Host
                    </span>
                  )}
                  {msg.user.role === 'dj' && (
                    <span className="text-[9px] bg-[#FF0000]/20 text-[#FF4D4D] px-1.5 py-0.2 rounded font-bold border border-[#FF0000]/30">
                      DJ
                    </span>
                  )}
                  <span className="text-[10px] text-[#717171] font-mono">{msg.timestamp}</span>
                </div>

                {/* Reply to quote */}
                {msg.replyTo && (
                  <div
                    className={`text-[11px] text-[#AAAAAA] pl-2 mb-1 line-clamp-1 italic py-0.5 rounded ${
                      isMe ? 'border-r-2 border-[#FF0000] pr-2 bg-[#272727]/80' : 'border-l-2 border-[#FF0000] bg-[#272727]/80'
                    }`}
                  >
                    <span className="font-semibold text-[#FF4D4D]">@{msg.replyTo.username}: </span>
                    {msg.replyTo.content}
                  </div>
                )}

                {/* Message Content Bubble */}
                <div className="relative group/msg inline-block text-left">
                  <div
                    className={`p-2.5 sm:p-3 rounded-2xl border text-xs leading-relaxed break-words shadow-sm ${
                      isMe
                        ? 'bg-[#FF0000]/15 border-[#FF0000]/40 text-white rounded-tr-sm'
                        : 'bg-[#272727] border-[#383838] text-[#F1F1F1] rounded-tl-sm'
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>

                  {/* Attached Real YouTube Song Card */}
                  {msg.songRef && (
                    <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-[#181818] border border-[#383838] shadow-md max-w-sm">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <ArtworkImage
                          song={msg.songRef}
                          alt={msg.songRef.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-semibold text-white truncate">{msg.songRef.title}</p>
                          <p className="text-[10px] text-[#AAAAAA] truncate">{msg.songRef.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => handlePlaySongPill(msg.songRef!)}
                          className="p-1.5 rounded-lg bg-[#FF0000] text-white hover:bg-[#CC0000] transition active:scale-95 cursor-pointer"
                          title="Play in Room"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                        {onQueueSong && (
                          <button
                            onClick={() => onQueueSong(msg.songRef!)}
                            className="p-1.5 rounded-lg bg-[#272727] text-[#AAAAAA] hover:text-white transition active:scale-95 cursor-pointer"
                            title="Add to room queue"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message Touch/Hover Actions */}
                  <div className="flex items-center gap-1 mt-1 opacity-90 sm:opacity-0 sm:group-hover/msg:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyingTo(msg);
                        inputRef.current?.focus();
                      }}
                      className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[#212121] hover:bg-[#2E2E2E] border border-[#383838] text-[10px] text-[#AAAAAA] hover:text-white transition active:scale-95 cursor-pointer"
                      title="Reply"
                    >
                      <CornerUpLeft className="w-2.5 h-2.5" />
                      <span>Reply</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendReaction('heart');
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#212121] hover:bg-[#2E2E2E] border border-[#383838] text-[10px] text-[#AAAAAA] hover:text-rose-400 transition active:scale-95 cursor-pointer"
                      title="Heart message"
                    >
                      <Heart className="w-2.5 h-2.5 fill-rose-500/20 text-rose-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#272727] border-t border-[#383838] text-xs animate-fade-in shrink-0">
          <span className="text-[#AAAAAA] truncate text-[11px]">
            Replying to <span className="font-bold text-white">@{replyingTo.user.displayName || replyingTo.user.username}</span>:
            <span className="italic ml-1">"{replyingTo.content.slice(0, 30)}..."</span>
          </span>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-[11px] text-[#AAAAAA] hover:text-white bg-[#333333] px-2 py-0.5 rounded ml-2 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Bottom Sticky Interactive Controls */}
      <div className="border-t border-[#272727] bg-[#212121] shrink-0 pb-2 sm:pb-3">
        {/* 1. Quick Vibe Preset Chips (One-Tap Messages) */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 no-scrollbar border-b border-[#2B2B2B]">
          {VIBE_PRESETS.map((vibe) => {
            const IconComp = vibe.icon;
            return (
              <button
                key={vibe.label}
                type="button"
                onClick={() => handleSubmit(undefined, vibe.text)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#272727] hover:bg-[#333333] border border-[#383838] text-[11px] font-semibold text-[#CCCCCC] hover:text-white transition shrink-0 active:scale-95 cursor-pointer shadow-sm"
              >
                <IconComp className="w-3 h-3 text-[#FF4D4D]" />
                <span>{vibe.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. One-Tap Quick Reactions Dock */}
        <div className="flex items-center justify-between px-3 py-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {QUICK_REACTIONS.map((r) => {
              const IconComp = r.icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSendReaction(r.id)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-[#272727] hover:bg-[#333333] active:scale-75 transition-all cursor-pointer shadow-sm hover:scale-110 ${r.color}`}
                  title={`Send ${r.label} burst`}
                >
                  <IconComp className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Message Input Form */}
        <form onSubmit={handleSubmit} className="px-3 pt-1 relative">
          {rateLimitWarning && (
            <div className="mb-2 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-2 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>{rateLimitWarning}</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#0F0F0F] border border-[#2B2B2B] focus-within:border-[#FF0000] rounded-2xl px-3 py-2 transition shadow-inner">
            <button
              type="button"
              onClick={() => onSendReaction('heart')}
              className="p-1 rounded-lg transition cursor-pointer active:scale-95 text-[#AAAAAA] hover:text-rose-400"
              title="Send Heart Reaction"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-rose-500/20 text-rose-500" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Chat with room or paste YouTube link..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-[#717171] focus:outline-none min-w-0"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white disabled:opacity-30 flex items-center justify-center transition active:scale-90 shadow-md cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
