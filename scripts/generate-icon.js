import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(len + 12);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, len + 8);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, len + 8);
  return buf;
}

function generateYouTubeMusicIcon(size = 512) {
  const width = size;
  const height = size;
  const rowSize = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.44;
  const ring1R = width * 0.36;
  const ring2R = width * 0.28;
  const ring3R = width * 0.20;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 0, g = 0, b = 0, a = 0;

      // Outer squircle / circle background
      if (dist <= outerR) {
        // YouTube Red gradient
        const t = (y / height);
        r = Math.round(255 - t * 25); // #FF0000 -> #E60000
        g = 0;
        b = Math.round(t * 15);
        a = 255;

        // Anti-aliased outer edge
        if (dist > outerR - 1.5) {
          a = Math.round(255 * (outerR - dist) / 1.5);
        }

        // Concentric Vinyl Record Grooves (YouTube Music Style)
        const inRing1 = Math.abs(dist - ring1R) < 2.0;
        const inRing2 = Math.abs(dist - ring2R) < 2.0;
        const inRing3 = Math.abs(dist - ring3R) < 2.0;

        if (inRing1 || inRing2 || inRing3) {
          // Subtle lighter highlight groove
          r = Math.min(255, r + 45);
          g = Math.min(255, g + 40);
          b = Math.min(255, b + 40);
        }

        // Play Triangle in center (pointing right)
        // Normalized coordinates in play triangle
        // Triangle vertices: Left-top (-0.08, -0.12), Left-bottom (-0.08, 0.12), Right (0.13, 0)
        const tx = dx / width;
        const ty = dy / height;

        const p1x = -0.07, p1y = -0.12;
        const p2x = -0.07, p2y = 0.12;
        const p3x = 0.12, p3y = 0.0;

        // Barycentric inside test
        const v0x = p3x - p1x, v0y = p3y - p1y;
        const v1x = p2x - p1x, v1y = p2y - p1y;
        const v2x = tx - p1x, v2y = ty - p1y;

        const dot00 = v0x * v0x + v0y * v0y;
        const dot01 = v0x * v1x + v0y * v1y;
        const dot02 = v0x * v2x + v0y * v2y;
        const dot11 = v1x * v1x + v1y * v1y;
        const dot12 = v1x * v2x + v1y * v2y;

        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        if (u >= 0 && v >= 0 && (u + v) <= 1) {
          // Pure crisp white play triangle
          r = 255;
          g = 255;
          b = 255;
          a = 255;
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // PNG Header
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  // IDAT (Deflate compressed)
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', iend)
  ]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icon.png (512x512)
const png512 = generateYouTubeMusicIcon(512);
fs.writeFileSync(path.join(publicDir, 'icon.png'), png512);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);

// Generate icon-192.png (192x192)
const png192 = generateYouTubeMusicIcon(192);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);

// Also generate SVG version
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="ytmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF0000" />
      <stop offset="100%" stop-color="#CC0000" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#FF0000" flood-opacity="0.45" />
    </filter>
  </defs>
  
  <!-- Outer YouTube Music Disc -->
  <circle cx="256" cy="256" r="230" fill="url(#ytmGrad)" filter="url(#glow)" />
  
  <!-- Concentric Vinyl Grooves -->
  <circle cx="256" cy="256" r="185" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="3" fill="none" />
  <circle cx="256" cy="256" r="145" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="3" fill="none" />
  <circle cx="256" cy="256" r="105" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="2.5" fill="none" />
  <circle cx="256" cy="256" r="68" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="2" fill="none" />
  
  <!-- Center Play Button Triangle -->
  <polygon points="215,180 215,332 335,256" fill="#FFFFFF" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

console.log('Successfully generated public/icon.png, public/icon-192.png, public/icon-512.png, public/icon.svg, and public/favicon.svg!');
