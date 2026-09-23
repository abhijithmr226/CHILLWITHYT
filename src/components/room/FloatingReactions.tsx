import React from 'react';
import { Heart, Flame, Sparkles, Rocket, ThumbsUp, Music, Zap, Star } from 'lucide-react';
import { FloatingReaction } from '../../types';

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

const renderReactionIcon = (key: string) => {
  const norm = key.toLowerCase();
  if (norm.includes('heart') || norm.includes('❤️') || norm.includes('love')) {
    return <Heart className="w-8 h-8 text-rose-500 fill-rose-500 drop-shadow-[0_0_16px_rgba(244,63,94,0.9)]" />;
  }
  if (norm.includes('fire') || norm.includes('🔥') || norm.includes('flame')) {
    return <Flame className="w-8 h-8 text-amber-500 fill-amber-500 drop-shadow-[0_0_16px_rgba(245,158,11,0.9)]" />;
  }
  if (norm.includes('sparkle') || norm.includes('✨') || norm.includes('vibe')) {
    return <Sparkles className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_16px_rgba(250,204,21,0.9)]" />;
  }
  if (norm.includes('rocket') || norm.includes('🚀') || norm.includes('banger')) {
    return <Rocket className="w-8 h-8 text-indigo-400 fill-indigo-400 drop-shadow-[0_0_16px_rgba(129,140,248,0.9)]" />;
  }
  if (norm.includes('thumb') || norm.includes('clap') || norm.includes('👏') || norm.includes('👍') || norm.includes('💯')) {
    return <ThumbsUp className="w-8 h-8 text-emerald-400 fill-emerald-400 drop-shadow-[0_0_16px_rgba(52,211,153,0.9)]" />;
  }
  if (norm.includes('zap') || norm.includes('⚡') || norm.includes('energy')) {
    return <Zap className="w-8 h-8 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_16px_rgba(34,211,238,0.9)]" />;
  }
  if (norm.includes('star') || norm.includes('★') || norm.includes('gold')) {
    return <Star className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.9)]" />;
  }
  // Default to Music
  return <Music className="w-8 h-8 text-pink-400 fill-pink-400 drop-shadow-[0_0_16px_rgba(244,114,182,0.9)]" />;
};

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-12 animate-float-reaction flex flex-col items-center select-none"
          style={{ left: `${r.xOffset}%` }}
        >
          <div className="transition-transform hover:scale-125">
            {renderReactionIcon(r.emoji)}
          </div>
          {r.user && (
            <span className="text-[10px] bg-black/70 backdrop-blur-md text-gray-200 px-2 py-0.5 rounded-full mt-1.5 border border-white/15 font-semibold shadow-lg">
              {r.user}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

