import React from 'react';

export type AdFormat = 'leaderboard' | 'rectangle' | 'skyscraper' | 'banner' | 'mobile';

interface AdConfig {
  key: string;
  width: number;
  height: number;
  name: string;
}

const AD_CONFIGS: Record<AdFormat, AdConfig> = {
  leaderboard: {
    key: 'b06e0ab4e9aa33e92091796e84f302ef',
    width: 728,
    height: 90,
    name: '728x90 Leaderboard',
  },
  rectangle: {
    key: 'd10e5dbdd297ff3824711fcf2a6c0350',
    width: 300,
    height: 250,
    name: '300x250 Medium Rectangle',
  },
  skyscraper: {
    key: '466bbc565d0c36c49e38e975a794cd30',
    width: 160,
    height: 600,
    name: '160x600 Wide Skyscraper',
  },
  banner: {
    key: '5d7999d44fcea2af4bdd5991f8605caa',
    width: 468,
    height: 60,
    name: '468x60 Banner',
  },
  mobile: {
    key: 'af9a94e8f2bd805ec15571ebcee7905e',
    width: 320,
    height: 50,
    name: '320x50 Mobile Banner',
  },
};

interface AdSlotProps {
  format: AdFormat;
  className?: string;
  showBadge?: boolean;
}

/**
 * Sandboxed Ad Slot Component
 * Uses isolated iframe srcDoc so ad scripts NEVER interfere with React DOM,
 * Web Audio, or touch interactions.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ format, className = '', showBadge = true }) => {
  const config = AD_CONFIGS[format];

  const iframeSrcDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${config.key}',
      'format' : 'iframe',
      'height' : ${config.height},
      'width' : ${config.width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highrevenueformat.com/${config.key}/invoke.js"></script>
</body>
</html>`;

  return (
    <div className={`flex flex-col items-center justify-center my-4 overflow-hidden select-none ${className}`}>
      {showBadge && (
        <span className="text-[9px] uppercase tracking-widest text-white/30 font-medium mb-1.5">
          Sponsored
        </span>
      )}
      <div
        className="rounded-xl overflow-hidden bg-[#161618]/60 border border-white/5 shadow-inner flex items-center justify-center transition-opacity hover:opacity-100 opacity-90"
        style={{ width: `${config.width}px`, height: `${config.height}px` }}
      >
        <iframe
          title={config.name}
          srcDoc={iframeSrcDoc}
          width={config.width}
          height={config.height}
          scrolling="no"
          frameBorder="0"
          className="border-0 overflow-hidden block"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
};

/**
 * Adaptive Banner: Shows 728x90 on Desktop, 468x60 on Tablet, and 320x50 on Mobile
 * Guarantees zero horizontal overflow on small phones.
 */
export const ResponsiveAdBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      {/* Desktop (728x90) */}
      <div className="hidden lg:block">
        <AdSlot format="leaderboard" />
      </div>

      {/* Tablet (468x60) */}
      <div className="hidden sm:block lg:hidden">
        <AdSlot format="banner" />
      </div>

      {/* Mobile (320x50) */}
      <div className="block sm:hidden">
        <AdSlot format="mobile" />
      </div>
    </div>
  );
};
