// Pure Node.js PNG generator — no dependencies needed
// Run: node generate-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(size, r, g, b) {
    // Create pixel data (RGBA)
    const pixels = Buffer.alloc(size * size * 4);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const cx = size / 2, cy = size / 2;
            const radius = size * 0.45;
            const cornerR = size * 0.18;

            // Rounded rectangle check
            const dx = Math.abs(x - cx) - (size/2 - cornerR);
            const dy = Math.abs(y - cy) - (size/2 - cornerR);
            const inRect = dx <= 0 || dy <= 0 || Math.sqrt(Math.max(dx,0)**2 + Math.max(dy,0)**2) <= cornerR;

            if (inRect) {
                // Draw shield in center
                const sx = x - cx, sy = y - cy;
                const shW = size * 0.26, shH = size * 0.31;
                const inShield = Math.abs(sx) < shW && sy > -shH && sy < shH * 0.8;

                if (inShield) {
                    // lighter shade for shield
                    pixels[idx]   = Math.min(255, r + 40);
                    pixels[idx+1] = Math.min(255, g + 40);
                    pixels[idx+2] = Math.min(255, b + 40);
                } else {
                    pixels[idx]   = r;
                    pixels[idx+1] = g;
                    pixels[idx+2] = b;
                }
                pixels[idx+3] = 255; // alpha
            }
            // else transparent
        }
    }

    // Build PNG
    function crc32(buf) {
        let crc = 0xFFFFFFFF;
        const table = [];
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            table[i] = c;
        }
        for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    function chunk(type, data) {
        const typeB = Buffer.from(type);
        const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
        const crcBuf = Buffer.concat([typeB, data]);
        const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(crcBuf));
        return Buffer.concat([len, typeB, data, crcVal]);
    }

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // RGBA
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    // Raw image data with filter byte per scanline
    const raw = Buffer.alloc(size * (size * 4 + 1));
    for (let y = 0; y < size; y++) {
        raw[y * (size * 4 + 1)] = 0; // filter none
        pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
    }

    const idat = zlib.deflateSync(raw);
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = path.join(__dirname, 'web', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

// Orange brand color: #FF6B00 = rgb(255, 107, 0)
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192, 255, 107, 0));
console.log('✅ icon-192.png (192x192) created');

fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512, 255, 107, 0));
console.log('✅ icon-512.png (512x512) created');

console.log('\n✅ Done! Icons saved to web/public/icons/');
