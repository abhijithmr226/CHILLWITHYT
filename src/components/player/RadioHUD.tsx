/**
 * RadioHUD — Live radio "Now On Air" overlay
 * 
 * Appears as a gorgeous station card that:
 * - Shows station name + vibe tag
 * - Pulses the "LIVE" dot during playback
 * - Triggers a full-screen crossfade "slide-up" when song changes
 * - Shows the next song in queue
 * - Has a radio waveform animation
 */

import React, { useEffect, useState, useRef } from 'react';
import { radioEngine, RadioState } from '../../services/audio/RadioEngine';
import { audioManager, PlaybackState } from '../../services/audio/AudioManager';
import { Radio, ChevronRight, Loader2, Wifi, Sparkles } from 'lucide-react';
import { ArtworkImage } from '../../utils/artwork';

interface RadioHUDProps {
  /** Where to render: 'bar' = bottom player inline, 'overlay' = full-screen transition card */
  variant?: 'bar' | 'overlay';
  className?: string;
}

// Mini animated waveform bars
const RadioWave: React.FC<{ isPlaying: boolean; color?: string }> = ({ isPlaying, color = '#FF0000' }) => {
  return (
    <div className="flex items-end gap-[2px] h-4" aria-hidden="true">
      {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.7, 0.4, 0.8, 0.6].map((h, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full origin-bottom"
          style={{
            height: `${h * 100}%`,
            backgroundColor: color,
            animationName: isPlaying ? 'radioBar' : 'none',
            animationDuration: `${0.5 + i * 0.08}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${i * 0.06}s`,
            opacity: isPlaying ? 0.9 : 0.3,
            transform: isPlaying ? undefined : `scaleY(0.3)`,
          }}
        />
      ))}
    </div>
  );
};

export const RadioHUD: React.FC<RadioHUDProps> = ({ variant = 'bar', className = '' }) => {
  const [radio, setRadio] = useState<RadioState>(radioEngine.getState());
  const [playback, setPlayback] = useState<PlaybackState>(audioManager.getState());
  const [isTransitionVisible, setIsTransitionVisible] = useState(false);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubRadio = radioEngine.subscribe(setRadio);
    const unsubAudio = audioManager.subscribe(setPlayback);
    return () => {
      unsubRadio();
      unsubAudio();
    };
  }, []);

  // Handle transition flash
  useEffect(() => {
    if (radio.isSongTransition) {
      setIsTransitionVisible(true);
      if (transitionRef.current) clearTimeout(transitionRef.current);
      transitionRef.current = setTimeout(() => {
        setIsTransitionVisible(false);
      }, 2600);
    }
  }, [radio.isSongTransition]);

  if (!radio.isRadioMode) return null;

  const song = playback.currentSong;

  // ── Overlay variant: full-screen transition splash ──
  if (variant === 'overlay') {
    return (
      <>
        {/* Song-change transition overlay */}
        <div
          className={`fixed inset-0 z-[200] pointer-events-none flex flex-col items-center justify-center transition-all duration-700 ${
            isTransitionVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: isTransitionVisible
              ? 'radial-gradient(ellipse at center, rgba(255,0,0,0.12) 0%, rgba(0,0,0,0.85) 70%)'
              : 'transparent',
            backdropFilter: isTransitionVisible ? 'blur(4px)' : 'none',
          }}
        >
          {isTransitionVisible && (
            <div
              className="flex flex-col items-center gap-4 animate-fade-in"
              style={{ animation: 'radioSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}
            >
              {/* Station pill */}
              <div className="flex items-center gap-2 bg-[#FF0000] rounded-full px-4 py-1.5 shadow-[0_0_24px_rgba(255,0,0,0.5)]">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white font-bold text-sm tracking-wide uppercase">{radio.stationName}</span>
              </div>

              {/* Now playing card */}
              {song && (
                <div className="flex items-center gap-4 bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10 max-w-sm w-full mx-4 shadow-2xl">
                  <ArtworkImage
                    song={song}
                    alt={song.title}
                    className="w-16 h-16 rounded-xl object-cover shadow-lg ring-1 ring-white/20 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF0000] mb-0.5 flex items-center gap-1">
                      <span>Now on Air</span>
                      <span className="text-[9px] text-white/50 lowercase">({radio.stationLanguage || 'infinite'})</span>
                    </p>
                    <p className="text-white font-bold text-sm leading-tight line-clamp-1">{song.title}</p>
                    <p className="text-[#AAAAAA] text-xs mt-0.5 truncate">{song.artist}</p>
                  </div>
                  <RadioWave isPlaying={true} />
                </div>
              )}

              <p className="text-white/40 text-xs">{radio.stationVibe}</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── Bar variant: compact inline indicator in the bottom player ──
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Live dot + station name */}
      <div className="flex items-center gap-1.5 bg-[#FF0000]/15 border border-[#FF0000]/30 rounded-full px-2.5 py-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0000] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF0000]" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF0000]">LIVE</span>
      </div>

      {/* Waveform */}
      <RadioWave isPlaying={playback.isPlaying} />

      {/* Station name — truncate on small screens */}
      <span className="text-[11px] font-semibold text-[#CCCCCC] hidden sm:block truncate max-w-[120px]">
        {radio.stationName}
      </span>

      {/* Preloading spinner */}
      {radio.isPreloading && (
        <Loader2 className="w-3 h-3 text-white/40 animate-spin" />
      )}

      {/* Next song chip */}
      {radio.nextSong && !radio.isPreloading && (
        <div className="hidden lg:flex items-center gap-1 text-[10px] text-white/40">
          <ChevronRight className="w-3 h-3" />
          <span className="truncate max-w-[80px]">{radio.nextSong.artist}</span>
        </div>
      )}
    </div>
  );
};

// Inject keyframes once globally
if (typeof document !== 'undefined' && !document.getElementById('radio-hud-styles')) {
  const style = document.createElement('style');
  style.id = 'radio-hud-styles';
  style.textContent = `
    @keyframes radioBar {
      from { transform: scaleY(0.3); }
      to { transform: scaleY(1.0); }
    }
    @keyframes radioSlideUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
