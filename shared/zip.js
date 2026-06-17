/*
 * Minimal ZIP writer (STORE method, no compression).
 *
 * Enough to package a downloadable trail: several HTML pages plus already-
 * compressed image assets (JPEG/PNG/WebP), which gain nothing from deflate.
 * Storing them verbatim keeps images byte-for-byte efficient — no base64
 * inflation — and keeps this dependency-free and tiny.
 *
 * zipSync(entries) -> Uint8Array
 *   entries: [{ name: string, data: string | Uint8Array }]
 *   Strings are encoded as UTF-8. Forward slashes in `name` create folders.
 */

const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        t[n] = c >>> 0;
    }
    return t;
})();

function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
        c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
}

function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }

export function zipSync(entries) {
    const enc = new TextEncoder();
    // Fixed timestamp (2021-01-01 00:00) so builds are reproducible.
    const DOS_TIME = 0;
    const DOS_DATE = ((2021 - 1980) << 9) | (1 << 5) | 1;

    const parts = [];          // byte arrays, concatenated at the end
    const central = [];        // central-directory records
    let offset = 0;

    function push(arr) {
        const bytes = arr instanceof Uint8Array ? arr : new Uint8Array(arr);
        parts.push(bytes);
        offset += bytes.length;
    }

    for (const entry of entries) {
        const nameBytes = enc.encode(entry.name);
        const data = typeof entry.data === 'string' ? enc.encode(entry.data) : entry.data;
        const crc = crc32(data);
        const localOffset = offset;

        push([].concat(
            u32(0x04034b50),          // local file header signature
            u16(20),                  // version needed
            u16(0x0800),              // flags: UTF-8 filename
            u16(0),                   // method: store
            u16(DOS_TIME), u16(DOS_DATE),
            u32(crc),
            u32(data.length),         // compressed size
            u32(data.length),         // uncompressed size
            u16(nameBytes.length),
            u16(0)                    // extra length
        ));
        push(nameBytes);
        push(data);

        central.push({ nameBytes, crc, size: data.length, localOffset });
    }

    const cdStart = offset;
    for (const c of central) {
        push([].concat(
            u32(0x02014b50),          // central directory header signature
            u16(20),                  // version made by
            u16(20),                  // version needed
            u16(0x0800),              // flags: UTF-8 filename
            u16(0),                   // method: store
            u16(DOS_TIME), u16(DOS_DATE),
            u32(c.crc),
            u32(c.size), u32(c.size),
            u16(c.nameBytes.length),
            u16(0),                   // extra length
            u16(0),                   // comment length
            u16(0),                   // disk number start
            u16(0),                   // internal attrs
            u32(0),                   // external attrs
            u32(c.localOffset)
        ));
        push(c.nameBytes);
    }
    const cdSize = offset - cdStart;

    push([].concat(
        u32(0x06054b50),              // end of central directory signature
        u16(0), u16(0),               // disk numbers
        u16(central.length), u16(central.length),
        u32(cdSize), u32(cdStart),
        u16(0)                        // comment length
    ));

    // Concatenate all chunks into one buffer.
    let total = 0;
    for (const p of parts) total += p.length;
    const out = new Uint8Array(total);
    let pos = 0;
    for (const p of parts) { out.set(p, pos); pos += p.length; }
    return out;
}

/** Trigger a browser download of raw bytes. */
export function downloadBytes(filename, bytes, mime) {
    const blob = new Blob([bytes], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
