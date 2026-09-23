/**
 * YouTubeEmbed — Shows the real YouTube video IFrame, synced to the AudioManager state.
 * 
 * The trick: Rather than creating a second player, we physically MOVE the existing
 * hidden YouTube player div into this container so audio stays uninterrupted.
 * On unmount, we return it to its off-screen home.
 * 
 * This avoids any video restart / audio gap when toggling video mode.
 */

import React, { useEffect, useRef } from 'react';

const PLAYER_CONTAINER_ID = 'chillwithyt-yt-player-container';
const PLAYER_ELEMENT_ID = 'chillwithyt-yt-element';

interface YouTubeEmbedProps {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  className?: string;
  showControls?: boolean;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const originalContainer = document.getElementById(PLAYER_CONTAINER_ID);
    const ytElement = document.getElementById(PLAYER_ELEMENT_ID);

    if (!mount || !originalContainer || !ytElement) return;

    // ── Reveal and move the hidden player INTO our visible container ──
    // Save original styles for restoration
    const origStyle = {
      position: originalContainer.style.position,
      bottom: originalContainer.style.bottom,
      left: originalContainer.style.left,
      width: originalContainer.style.width,
      height: originalContainer.style.height,
      opacity: originalContainer.style.opacity,
      pointerEvents: originalContainer.style.pointerEvents,
    };

    // Show the player at our mount point
    originalContainer.style.position = 'static';
    originalContainer.style.bottom = '';
    originalContainer.style.left = '';
    originalContainer.style.width = '100%';
    originalContainer.style.height = '100%';
    originalContainer.style.opacity = '1';
    originalContainer.style.pointerEvents = 'auto';

    // Move the container div inside our mount div
    mount.appendChild(originalContainer);

    // Make the actual iframe inside fill space
    const iframe = originalContainer.querySelector('iframe');
    if (iframe) {
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.position = 'absolute';
      iframe.style.inset = '0';
      iframe.style.border = 'none';
      iframe.style.borderRadius = 'inherit';
    }

    // Also make inner element fill
    const inner = document.getElementById(PLAYER_ELEMENT_ID);
    if (inner) {
      inner.style.width = '100%';
      inner.style.height = '100%';
      inner.style.position = 'absolute';
      inner.style.inset = '0';
    }

    return () => {
      // ── On unmount: restore the hidden player back off-screen ──
      Object.assign(originalContainer.style, origStyle);

      if (iframe) {
        iframe.style.width = '';
        iframe.style.height = '';
        iframe.style.position = '';
        iframe.style.inset = '';
        iframe.style.border = '';
      }
      if (inner) {
        inner.style.width = '';
        inner.style.height = '';
        inner.style.position = '';
        inner.style.inset = '';
      }

      document.body.appendChild(originalContainer);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoId]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ background: '#000' }}
    />
  );
};
