import React, { useEffect, useRef, useState } from 'react';
import { Song } from '../../types';
import { audioManager } from '../../services/audio/AudioManager';
import { detectSongGenre, GenreProfile } from '../../services/audio/VisualizerEngine';
import { Zap, Sparkles, Activity, Disc3 } from 'lucide-react';

interface VideoFrameSpectrumProps {
  children: React.ReactNode;
  song?: Song | null;
  isPlaying?: boolean;
  onBeat?: (strength: number, genre: GenreProfile) => void;
  className?: string;
}

export const VideoFrameSpectrum: React.FC<VideoFrameSpectrumProps> = ({
  children,
  song,
  isPlaying = false,
  onBeat,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [genre, setGenre] = useState<GenreProfile>(() => detectSongGenre(song));
  const [isBeatKick, setIsBeatKick] = useState(false);
  const [beatStrength, setBeatStrength] = useState(0);

  // Update genre when song changes
  useEffect(() => {
    const detected = detectSongGenre(song);
    setGenre(detected);
  }, [song]);

  // Canvas perimeter spectrum animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    let lastBeatTime = 0;
    let smoothBounce = 0;

    // Smoothed bar heights & peak hold values for all 4 perimeters
    const NUM_TOP_BARS = 36;
    const NUM_SIDE_BARS = 18;

    const topBars = new Float32Array(NUM_TOP_BARS);
    const topPeaks = new Float32Array(NUM_TOP_BARS);

    const bottomBars = new Float32Array(NUM_TOP_BARS);
    const bottomPeaks = new Float32Array(NUM_TOP_BARS);

    const leftBars = new Float32Array(NUM_SIDE_BARS);
    const leftPeaks = new Float32Array(NUM_SIDE_BARS);

    const rightBars = new Float32Array(NUM_SIDE_BARS);
    const rightPeaks = new Float32Array(NUM_SIDE_BARS);

    let containerW = 0;
    let containerH = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const logicalW = containerW + 80;
      const logicalH = containerH + 80;

      if (logicalW <= 80 || logicalH <= 80) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, logicalW, logicalH);

      const now = performance.now();
      const currentSec = audioManager.getState().currentTime;
      const bpm = genre.bpm || 128;
      const beatsPerSec = bpm / 60;
      const beatIntervalMs = 1000 / beatsPerSec;

      // Fractional position within beat
      const beatPhase = (currentSec * beatsPerSec) % 1.0;
      const isDownbeat = beatPhase < 0.12 && (now - lastBeatTime > beatIntervalMs * 0.7);

      if (isDownbeat && isPlaying) {
        lastBeatTime = now;
        const kickStrength = 0.85 + Math.random() * 0.15;
        setIsBeatKick(true);
        setBeatStrength(kickStrength);
        smoothBounce = 1.0;
        if (onBeat) onBeat(kickStrength, genre);
        setTimeout(() => setIsBeatKick(false), 130);
      }

      smoothBounce *= 0.88;
      phase += isPlaying ? 0.05 : 0.008;

      const innerX = 40;
      const innerY = 40;
      const innerW = containerW;
      const innerH = containerH;

      if (innerW > 50 && innerH > 50) {
        // ── 1. Refined Studio Acoustic Perimeter Frame (Non-intrusive) ──
        ctx.save();
        ctx.shadowBlur = isPlaying ? (8 + smoothBounce * 12) : 4;
        ctx.shadowColor = isBeatKick ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = isBeatKick
          ? 'rgba(255, 255, 255, 0.3)'
          : isPlaying
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = isBeatKick ? 1.5 : 1;

        // Rounded rect for frame border
        ctx.beginPath();
        const r = 18;
        ctx.moveTo(innerX + r, innerY);
        ctx.lineTo(innerX + innerW - r, innerY);
        ctx.quadraticCurveTo(innerX + innerW, innerY, innerX + innerW, innerY + r);
        ctx.lineTo(innerX + innerW, innerY + innerH - r);
        ctx.quadraticCurveTo(innerX + innerW, innerY + innerH, innerX + innerW - r, innerY + innerH);
        ctx.lineTo(innerX + r, innerY + innerH);
        ctx.quadraticCurveTo(innerX, innerY + innerH, innerX, innerY + innerH - r);
        ctx.lineTo(innerX, innerY + r);
        ctx.quadraticCurveTo(innerX, innerY, innerX + r, innerY);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // ── 2. Top Perimeter Equalizer Bars (Shooting Upward) ──
        const topStep = (innerW - 36) / (NUM_TOP_BARS - 1);
        for (let i = 0; i < NUM_TOP_BARS; i++) {
          const wave = Math.sin(i * 0.35 + phase * 2.6) * 0.5 + 0.5;
          const bassWeight = 1 - Math.abs(i - NUM_TOP_BARS / 2) / (NUM_TOP_BARS / 2);
          const targetH = isPlaying
            ? (wave * 12 + bassWeight * 14 * (1 + smoothBounce * 2.2))
            : 3;
          topBars[i] += (targetH - topBars[i]) * 0.38;

          // Peak hold with gravity
          if (topBars[i] > topPeaks[i]) {
            topPeaks[i] = topBars[i];
          } else {
            topPeaks[i] = Math.max(3, topPeaks[i] - 0.7);
          }

          const bx = innerX + 18 + i * topStep;
          const by = innerY;
          const bh = topBars[i];
          const peakH = topPeaks[i];

          const grad = ctx.createLinearGradient(bx, by, bx, by - bh);
          grad.addColorStop(0, '#FF0000');
          grad.addColorStop(0.6, '#FF5500');
          grad.addColorStop(1, smoothBounce > 0.4 ? '#FFD700' : '#FF7700');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(bx - 2.5, by - bh, 5, bh, [3, 3, 0, 0]);
          ctx.fill();

          // Glowing peak hold dot
          if (peakH > 4) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(bx - 2, by - peakH - 3, 4, 2);
          }
        }

        // ── 3. Bottom Perimeter Equalizer Bars (Shooting Downward) ──
        const bottomStep = (innerW - 36) / (NUM_TOP_BARS - 1);
        for (let i = 0; i < NUM_TOP_BARS; i++) {
          const wave = Math.cos(i * 0.38 + phase * 2.4) * 0.5 + 0.5;
          const bassWeight = 1 - Math.abs(i - NUM_TOP_BARS / 2) / (NUM_TOP_BARS / 2);
          const targetH = isPlaying
            ? (wave * 12 + bassWeight * 14 * (1 + smoothBounce * 2.2))
            : 3;
          bottomBars[i] += (targetH - bottomBars[i]) * 0.38;

          if (bottomBars[i] > bottomPeaks[i]) {
            bottomPeaks[i] = bottomBars[i];
          } else {
            bottomPeaks[i] = Math.max(3, bottomPeaks[i] - 0.7);
          }

          const bx = innerX + 18 + i * bottomStep;
          const by = innerY + innerH;
          const bh = bottomBars[i];
          const peakH = bottomPeaks[i];

          const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
          grad.addColorStop(0, '#FF0000');
          grad.addColorStop(0.6, '#FF5500');
          grad.addColorStop(1, smoothBounce > 0.4 ? '#FFD700' : '#FF7700');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(bx - 2.5, by, 5, bh, [0, 0, 3, 3]);
          ctx.fill();

          if (peakH > 4) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(bx - 2, by + peakH + 2, 4, 2);
          }
        }

        // ── 4. Left Perimeter Equalizer Bars (Shooting Leftward) ──
        const sideStep = (innerH - 32) / (NUM_SIDE_BARS - 1);
        for (let i = 0; i < NUM_SIDE_BARS; i++) {
          const wave = Math.sin(i * 0.55 + phase * 3) * 0.5 + 0.5;
          const targetW = isPlaying ? (wave * 9 + smoothBounce * 14) : 3;
          leftBars[i] += (targetW - leftBars[i]) * 0.38;

          if (leftBars[i] > leftPeaks[i]) {
            leftPeaks[i] = leftBars[i];
          } else {
            leftPeaks[i] = Math.max(3, leftPeaks[i] - 0.7);
          }

          const bx = innerX;
          const by = innerY + 16 + i * sideStep;
          const bw = leftBars[i];
          const peakW = leftPeaks[i];

          const grad = ctx.createLinearGradient(bx, by, bx - bw, by);
          grad.addColorStop(0, '#FF0000');
          grad.addColorStop(1, '#FF7700');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(bx - bw, by - 2.5, bw, 5, [3, 0, 0, 3]);
          ctx.fill();

          if (peakW > 4) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(bx - peakW - 3, by - 2, 2, 4);
          }
        }

        // ── 5. Right Perimeter Equalizer Bars (Shooting Rightward) ──
        for (let i = 0; i < NUM_SIDE_BARS; i++) {
          const wave = Math.cos(i * 0.55 + phase * 3) * 0.5 + 0.5;
          const targetW = isPlaying ? (wave * 9 + smoothBounce * 14) : 3;
          rightBars[i] += (targetW - rightBars[i]) * 0.38;

          if (rightBars[i] > rightPeaks[i]) {
            rightPeaks[i] = rightBars[i];
          } else {
            rightPeaks[i] = Math.max(3, rightPeaks[i] - 0.7);
          }

          const bx = innerX + innerW;
          const by = innerY + 16 + i * sideStep;
          const bw = rightBars[i];
          const peakW = rightPeaks[i];

          const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
          grad.addColorStop(0, '#FF0000');
          grad.addColorStop(1, '#FF7700');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(bx, by - 2.5, bw, 5, [0, 3, 3, 0]);
          ctx.fill();

          if (peakW > 4) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(bx + peakW + 2, by - 2, 2, 4);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          containerW = Math.floor(width);
          containerH = Math.floor(height);
          const dpr = window.devicePixelRatio || 1;
          canvas.width = Math.floor((width + 80) * dpr);
          canvas.height = Math.floor((height + 80) * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [genre, isPlaying, onBeat]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full transition-transform duration-100 ease-out ${
        isBeatKick ? 'scale-[1.018]' : 'scale-100'
      } ${className}`}
    >
      {/* ── 1. OUTER PERIMETER EQUALIZER CANVAS (Shooting Outward on All 4 Sides) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-[-40px] w-[calc(100%+80px)] h-[calc(100%+80px)] pointer-events-none z-[55]"
      />

      {/* ── 3. TACTICAL CORNER BRACKETS ── */}
      <div
        className={`absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 rounded-tl-lg pointer-events-none transition-all duration-150 z-[56] ${
          isBeatKick ? 'border-white scale-125 shadow-[0_0_12px_#FF0000]' : 'border-[#FF0000]/70'
        }`}
      />
      <div
        className={`absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 rounded-tr-lg pointer-events-none transition-all duration-150 z-[56] ${
          isBeatKick ? 'border-white scale-125 shadow-[0_0_12px_#FF0000]' : 'border-[#FF0000]/70'
        }`}
      />
      <div
        className={`absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 rounded-bl-lg pointer-events-none transition-all duration-150 z-[56] ${
          isBeatKick ? 'border-white scale-125 shadow-[0_0_12px_#FF0000]' : 'border-[#FF0000]/70'
        }`}
      />
      <div
        className={`absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 rounded-br-lg pointer-events-none transition-all duration-150 z-[56] ${
          isBeatKick ? 'border-white scale-125 shadow-[0_0_12px_#FF0000]' : 'border-[#FF0000]/70'
        }`}
      />

      {/* ── 4. ACTUAL VIDEO PLAYER CONTAINER ── */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.3)] ring-1 ring-[#FF0000]/30">
        {children}
      </div>
    </div>
  );
};
