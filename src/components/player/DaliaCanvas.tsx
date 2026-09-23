import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Globe, Disc3, Zap, Sparkles, Network, CircleDot } from 'lucide-react';
import { Song } from '../../types';
import { DaliaVisualizer3D, DaliaPreset } from '../../services/visualizer/DaliaVisualizer3D';

const PRESETS: { id: DaliaPreset; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'VectorSphere',        label: 'Vector Sphere',    icon: Globe },
  { id: 'MutantTorus',         label: 'Mutant Torus',     icon: Disc3 },
  { id: 'PlasmaField',         label: 'Plasma Field',     icon: Zap },
  { id: 'NebulaVortex',        label: 'Nebula Vortex',    icon: Sparkles },
  { id: 'GalacticWeb',         label: 'Galactic Web',     icon: Network },
  { id: 'BlackHoleSingularity',label: 'Black Hole',       icon: CircleDot },
];

interface DaliaCanvasProps {
  song?: Song | null;
  className?: string;
  showPresetBar?: boolean;
  /** Thumbnail aspect: 'square' | '16/9' | '4/3'. Default is square */
  artAspect?: 'square' | '16/9' | '4/3';
}

export const DaliaCanvas: React.FC<DaliaCanvasProps> = ({
  song,
  className = '',
  showPresetBar = true,
  artAspect = 'square',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const visualizerRef = useRef<DaliaVisualizer3D | null>(null);
  const [activePreset, setActivePreset] = useState<DaliaPreset>('VectorSphere');
  const [mounted, setMounted] = useState(false);

  const initVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Match canvas resolution to container
    const rect = container.getBoundingClientRect();
    const w = rect.width || canvas.offsetWidth || 480;
    const h = rect.height || canvas.offsetHeight || 480;
    canvas.width = w;
    canvas.height = h;

    if (visualizerRef.current) {
      visualizerRef.current.dispose();
    }

    const viz = new DaliaVisualizer3D(canvas);
    if (song) viz.updateSong(song);
    viz.start();
    visualizerRef.current = viz;
    setActivePreset(viz.getCurrentPreset());
    setMounted(true);
  }, [song]);

  useEffect(() => {
    initVisualizer();

    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const viz = visualizerRef.current;
      if (!canvas || !container || !viz) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      viz.resize(rect.width, rect.height);
    };

    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      visualizerRef.current?.dispose();
      visualizerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current && song) {
      visualizerRef.current.updateSong(song);
      setActivePreset(visualizerRef.current.getCurrentPreset());
    }
  }, [song]);

  const handlePresetClick = (preset: DaliaPreset) => {
    visualizerRef.current?.switchPreset(preset);
    setActivePreset(preset);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ background: 'transparent' }}
    >
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ display: 'block' }}
      />

      {/* Preset Selector Bar */}
      {showPresetBar && mounted && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 pb-2 px-2">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2 py-1 border border-white/10">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetClick(p.id)}
                title={p.label}
                className={`w-7 h-7 rounded-full text-xs transition-all cursor-pointer flex items-center justify-center ${
                  activePreset === p.id
                    ? 'bg-white/25 scale-115 shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                    : 'hover:bg-white/10 opacity-60 hover:opacity-100'
                }`}
              >
                <p.icon className="w-3.5 h-3.5 text-white" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
