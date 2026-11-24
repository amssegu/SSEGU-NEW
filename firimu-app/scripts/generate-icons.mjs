import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve(process.cwd(), 'public');
fs.mkdirSync(publicDir, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function blend(dst, idx, r, g, b, a) {
  const alpha = clamp(a);
  if (alpha <= 0) return;
  const inv = 1 - alpha;
  dst[idx] = Math.round(dst[idx] * inv + r * alpha);
  dst[idx + 1] = Math.round(dst[idx + 1] * inv + g * alpha);
  dst[idx + 2] = Math.round(dst[idx + 2] * inv + b * alpha);
  dst[idx + 3] = Math.round(Math.min(255, dst[idx + 3] + 255 * alpha * (1 - dst[idx + 3] / 255)));
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax;
  const v0y = cy - ay;
  const v1x = bx - ax;
  const v1y = by - ay;
  const v2x = px - ax;
  const v2y = py - ay;

  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;

  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  return u >= 0 && v >= 0 && u + v <= 1;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function renderIcon(size, { maskable = false, fullBleed = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const half = size / 2;
  const cornerRadius = fullBleed || maskable ? 0 : size * 0.22;
  const circleRadius = maskable ? size * 0.25 : size * 0.29;

  // Triangle vertices scaled nicely inside circle
  const triScale = maskable ? 0.86 : 1.0;
  const ax = half - size * 0.075 * triScale;
  const ay = half - size * 0.135 * triScale;
  const bx = half - size * 0.075 * triScale;
  const by = half + size * 0.135 * triScale;
  const cx = half + size * 0.155 * triScale;
  const cy = half;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const px = x + 0.5;
      const py = y + 0.5;

      // Background rounded rect SDF
      let bgAlpha = 1;
      if (cornerRadius > 0) {
        const qx = Math.abs(px - half) - (half - cornerRadius);
        const qy = Math.abs(py - half) - (half - cornerRadius);
        const sdf = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - cornerRadius;
        bgAlpha = clamp(0.5 - sdf);
      }

      if (bgAlpha > 0) {
        const grad = (px + py) / (2 * size);
        const bgR = Math.round(20 - grad * 11);
        const bgG = Math.round(20 - grad * 11);
        const bgB = Math.round(27 - grad * 14);
        rgba[idx] = bgR;
        rgba[idx + 1] = bgG;
        rgba[idx + 2] = bgB;
        rgba[idx + 3] = Math.round(255 * bgAlpha);
      }

      // Subtle outer crimson halo
      const distCenter = Math.hypot(px - half, py - half);
      if (distCenter < circleRadius * 1.25 && distCenter > circleRadius * 0.9) {
        const glow = clamp(1 - (distCenter - circleRadius * 0.9) / (circleRadius * 0.35)) * 0.22;
        blend(rgba, idx, 229, 9, 20, glow);
      }

      // Crimson circle
      const circleAlpha = clamp(circleRadius - distCenter + 0.5);
      if (circleAlpha > 0) {
        const t = (px - (half - circleRadius) + (py - (half - circleRadius))) / (4 * circleRadius);
        const r = Math.round(255 - clamp(t) * 52);
        const g = Math.round(24 - clamp(t) * 16);
        const b = Math.round(34 - clamp(t) * 16);
        blend(rgba, idx, r, g, b, circleAlpha);
      }

      // White play triangle with 1px anti-aliasing
      const insideTri = pointInTriangle(px, py, ax, ay, bx, by, cx, cy);
      const edgeDist = Math.min(
        distToSegment(px, py, ax, ay, bx, by),
        distToSegment(px, py, bx, by, cx, cy),
        distToSegment(px, py, cx, cy, ax, ay)
      );
      const triSdf = insideTri ? edgeDist : -edgeDist;
      const triAlpha = clamp(0.5 + triSdf);
      if (triAlpha > 0) {
        blend(rgba, idx, 255, 255, 255, triAlpha);
      }
    }
  }

  return encodePNG(size, size, rgba);
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderIcon(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderIcon(512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), renderIcon(512, { maskable: true }));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderIcon(180, { fullBleed: true }));
console.log('Generated PWA PNG icons in public/');
