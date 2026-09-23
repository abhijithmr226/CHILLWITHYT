import React, { useEffect, useRef } from 'react';
import { VisualizerConfig, Song } from '../../types';
import { VisualizerRenderer, GenreProfile } from '../../services/audio/VisualizerEngine';
import { audioManager } from '../../services/audio/AudioManager';

interface VisualizerCanvasProps {
  config: VisualizerConfig;
  song?: Song | null;
  className?: string;
  width?: number;
  height?: number;
  onBeat?: (strength: number, genre: GenreProfile) => void;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  config,
  song,
  className = '',
  width = 400,
  height = 400,
  onBeat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<VisualizerRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new VisualizerRenderer(canvas, config);
    if (song) {
      renderer.updateSong(song);
    } else {
      const active = audioManager.getState().currentSong;
      if (active) renderer.updateSong(active);
    }

    if (onBeat) {
      renderer.setOnBeatListener(onBeat);
    }

    rendererRef.current = renderer;
    renderer.start();

    // Listen to track transitions
    let lastSongId: string | null = song?.id || null;
    const unsubscribeAudio = audioManager.subscribe((playback) => {
      if (rendererRef.current && playback.currentSong && playback.currentSong.id !== lastSongId) {
        lastSongId = playback.currentSong.id;
        rendererRef.current.updateSong(playback.currentSong);
      }
    });

    return () => {
      unsubscribeAudio();
      renderer.stop();
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateConfig(config);
    }
  }, [config]);

  useEffect(() => {
    if (rendererRef.current && song) {
      rendererRef.current.updateSong(song);
    }
  }, [song]);

  useEffect(() => {
    if (rendererRef.current && onBeat) {
      rendererRef.current.setOnBeatListener(onBeat);
    }
  }, [onBeat]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`pointer-events-none ${className}`}
    />
  );
};
