import React, { useState, useEffect } from 'react';
import { Song, Room } from '../../types';
import { useStore } from '../../store/useStore';
import { radioEngine, RoomSongDuel } from '../../services/audio/RadioEngine';
import { audioManager } from '../../services/audio/AudioManager';
import { ArtworkImage } from '../../utils/artwork';
import {
  Vote,
  Clock,
  Flame,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface RoomVotingDuelProps {
  room: Room;
  defaultExpanded?: boolean;
}

export const RoomVotingDuel: React.FC<RoomVotingDuelProps> = ({ room, defaultExpanded = true }) => {
  const [state] = useStore();
  const [duel, setDuel] = useState<RoomSongDuel | null>(() => radioEngine.getRoomDuel(room.id));
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const currentUserId = state.currentUser?.id || 'guest';

  // Initialize or fetch active duel
  useEffect(() => {
    let active = radioEngine.getRoomDuel(room.id);
    if (!active) {
      setIsGenerating(true);
      radioEngine.generateRoomVotingDuel(room.id, room.currentSong).then((d) => {
        setDuel(d);
        setIsGenerating(false);
      });
    } else {
      setDuel(active);
    }
  }, [room.id]);

  // Countdown timer effect
  useEffect(() => {
    if (!duel) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((duel.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Resolve winner and queue track
        const winner = radioEngine.resolveVotingDuel(room.id);
        if (winner) {
          audioManager.addToQueue(winner);
        }
        // Regenerate next duel smoothly
        setTimeout(() => {
          radioEngine.generateRoomVotingDuel(room.id, winner || room.currentSong).then(setDuel);
        }, 2000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duel?.expiresAt, room.id]);

  const handleVote = (choice: 'A' | 'B') => {
    const updated = radioEngine.castDuelVote(room.id, currentUserId, choice);
    if (updated) {
      setDuel({ ...updated });
    }
  };

  const handleRefreshDuel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
    const fresh = await radioEngine.generateRoomVotingDuel(room.id, room.currentSong);
    setDuel(fresh);
    setIsGenerating(false);
  };

  if (isGenerating && !duel) {
    return (
      <div className="py-2.5 px-3 rounded-xl bg-[#161618] border border-white/10 text-center text-xs text-[#888888] flex items-center justify-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF0000]" />
        <span>Curating next song duel...</span>
      </div>
    );
  }

  if (!duel) return null;

  const totalVotes = duel.votesA + duel.votesB;
  const percentA = totalVotes > 0 ? Math.round((duel.votesA / totalVotes) * 100) : 0;
  const percentB = totalVotes > 0 ? 100 - percentA : 0;
  const userVote = duel.voterIds[currentUserId];
  const isUrgent = timeLeft <= 10;

  return (
    <div className="rounded-2xl bg-[#141416] border border-white/10 p-2.5 sm:p-3 shadow-lg select-none space-y-2 transition-all">
      {/* Compact Duel Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#FF0000]/15 text-[#FF0000] flex items-center justify-center shrink-0 border border-[#FF0000]/20">
            <Vote className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="text-xs font-bold text-white tracking-wide truncate">
              Next Song Duel
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#CCCCCC] font-medium shrink-0">
              {totalVotes === 0 ? 'No votes yet' : `${totalVotes} vote${totalVotes === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Timer pill */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold transition ${
            isUrgent
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-black/40 text-[#AAAAAA] border-white/10'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{timeLeft}s{isUrgent ? ' left!' : ''}</span>
          </div>

          {/* Roll new duel button */}
          <button
            onClick={handleRefreshDuel}
            title="Roll 2 new songs"
            className="p-1 rounded-lg bg-[#202024] hover:bg-[#2A2A30] text-[#888888] hover:text-white transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>

          {/* Toggle expand/collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded-lg bg-[#202024] text-[#888888] hover:text-white transition cursor-pointer"
            title={isExpanded ? 'Collapse duel' : 'Expand duel'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Duel Voting Body (Slim, non-intrusive horizontal options) */}
      {isExpanded && (
        <div className="space-y-2 pt-1 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Track A */}
            <div
              onClick={() => handleVote('A')}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.99] ${
                userVote === 'A'
                  ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/40'
                  : 'bg-[#1C1C20] hover:bg-[#222228] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-900 ring-1 ring-white/10">
                  <ArtworkImage song={duel.songA} alt={duel.songA.title} className="w-full h-full object-cover" />
                  {userVote === 'A' && (
                    <div className="absolute inset-0 bg-rose-600/40 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{duel.songA.title}</p>
                  <p className="text-[10px] text-[#888888] truncate">{duel.songA.artist}</p>
                </div>
              </div>

              {/* Vote result indicator */}
              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono font-bold text-white">
                  {totalVotes > 0 ? `${percentA}%` : 'Vote'}
                </span>
                <p className="text-[9px] text-[#777777]">
                  {duel.votesA} {duel.votesA === 1 ? 'vote' : 'votes'}
                </p>
              </div>
            </div>

            {/* Track B */}
            <div
              onClick={() => handleVote('B')}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.99] ${
                userVote === 'B'
                  ? 'bg-cyan-950/30 border-cyan-500/60 ring-1 ring-cyan-500/40'
                  : 'bg-[#1C1C20] hover:bg-[#222228] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-900 ring-1 ring-white/10">
                  <ArtworkImage song={duel.songB} alt={duel.songB.title} className="w-full h-full object-cover" />
                  {userVote === 'B' && (
                    <div className="absolute inset-0 bg-cyan-600/40 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{duel.songB.title}</p>
                  <p className="text-[10px] text-[#888888] truncate">{duel.songB.artist}</p>
                </div>
              </div>

              {/* Vote result indicator */}
              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono font-bold text-white">
                  {totalVotes > 0 ? `${percentB}%` : 'Vote'}
                </span>
                <p className="text-[9px] text-[#777777]">
                  {duel.votesB} {duel.votesB === 1 ? 'vote' : 'votes'}
                </p>
              </div>
            </div>
          </div>

          {/* Duel Progress Bar - Only visible if votes exist */}
          {totalVotes > 0 && (
            <div className="w-full h-1.5 rounded-full bg-[#202024] overflow-hidden flex">
              <div
                style={{ width: `${percentA}%` }}
                className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300"
              />
              <div
                style={{ width: `${percentB}%` }}
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-300"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
