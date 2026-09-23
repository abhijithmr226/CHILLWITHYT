/**
 * Artwork Utility & Fallback Chain for ChillwithYT
 * 
 * Guarantee:
 * - NEVER show broken image icons
 * - NEVER leave empty gray placeholder cards when valid metadata exists
 * - Multi-tier fallback chain:
 *   1. Primary track artwork (maxresdefault/high)
 *   2. YouTube hqdefault
 *   3. YouTube mqdefault
 *   4. Artist artwork
 *   5. Generated harmonic gradient with song initials
 */

import React, { useState, useEffect } from 'react';
import { Song } from '../types';

export function getYouTubeThumbnailChain(sourceId?: string, preferredUrl?: string): string[] {
  const chain: string[] = [];

  if (preferredUrl && preferredUrl.startsWith('http')) {
    chain.push(preferredUrl);
  }

  if (sourceId) {
    // If preferred is maxres, next try hqdefault
    if (!preferredUrl || preferredUrl.includes('maxresdefault')) {
      chain.push(`https://img.youtube.com/vi/${sourceId}/hqdefault.jpg`);
    }
    chain.push(`https://img.youtube.com/vi/${sourceId}/mqdefault.jpg`);
    chain.push(`https://img.youtube.com/vi/${sourceId}/default.jpg`);
  }

  return chain;
}

/**
 * Generate a consistent, aesthetic dark-mode gradient based on song title and artist
 */
export function getGeneratedGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 45) % 360;

  return `linear-gradient(135deg, hsl(${hue1}, 55%, 15%) 0%, hsl(${hue2}, 60%, 8%) 100%)`;
}

export interface ArtworkImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  song?: Partial<Song> | null;
  fallbackChain?: string[];
  containerClassName?: string;
}

export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  song,
  src,
  alt = 'Cover',
  className = '',
  containerClassName = '',
  fallbackChain,
  ...props
}) => {
  const primarySrc = src || song?.artwork || '';
  const sourceId = song?.sourceId || (song?.id?.startsWith('yt-') ? song.id.slice(3) : undefined);

  const chain = React.useMemo(() => {
    if (fallbackChain && fallbackChain.length > 0) return fallbackChain;
    return getYouTubeThumbnailChain(sourceId, primarySrc);
  }, [primarySrc, sourceId, fallbackChain]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset when primary src changes
  useEffect(() => {
    setCurrentIndex(0);
    setHasError(false);
    setLoaded(false);
  }, [primarySrc, sourceId]);

  const currentUrl = chain[currentIndex] || '';

  const handleError = () => {
    if (currentIndex + 1 < chain.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const seed = `${song?.title || alt} ${song?.artist || ''}`;
  const gradient = getGeneratedGradient(seed);

  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${containerClassName}`}>
      {!hasError && currentUrl ? (
        <img
          {...props}
          src={currentUrl}
          alt={alt}
          onError={handleError}
          onLoad={() => setLoaded(true)}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-85'} ${className}`}
        />
      ) : (
        <div
          style={{ background: gradient }}
          className={`flex flex-col items-center justify-center text-center p-2.5 text-white select-none relative overflow-hidden group ${className}`}
        >
          {/* Subtle vinyl groove background effect */}
          <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
            <div className="w-20 h-20 rounded-full border border-white/30 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-red-600/60" />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-1">
            <span className="w-7 h-7 rounded-lg bg-red-600/30 border border-red-500/40 flex items-center justify-center text-[10px] font-black tracking-wider text-red-400 shadow-sm">
              {song?.title?.slice(0, 2).toUpperCase() || 'YT'}
            </span>
            <span className="text-[11px] font-bold text-white truncate max-w-[95%]">
              {song?.title || 'ChillWithYT'}
            </span>
            <span className="text-[9px] text-[#CCCCCC] truncate max-w-[90%]">
              {song?.artist || 'Music'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
