/*
 * Block Stacker — block skin registry
 * ------------------------------------
 * This module is the single place that decides how a stacked block LOOKS.
 * The game logic only ever calls `BlockSkins.draw(...)` and never hard-codes a
 * colour, so adding a brand-new look is as easy as calling
 * `BlockSkins.register({ ... })` — see the examples at the bottom of the file.
 *
 * A skin is a plain object:
 *   {
 *     id:        'spectrum',                 // unique key, used in storage / URLs
 *     name:      'Spectrum',                 // label shown in the picker
 *     swatch:    '#ff5d73',                  // (optional) colour for the menu chip
 *     colorFor(index) { return '#rrggbb'; }, // base colour for the Nth block
 *     render(ctx, rect, index, helpers) {},  // (optional) FULL custom drawing
 *   }
 *
 * If `render` is omitted the default renderer draws a tidy rounded block with a
 * gradient + top highlight using `colorFor(index)`. Provide `render` when you
 * want something completely different (patterns, emoji, images, …). The
 * `helpers` argument gives you handy utilities so custom skins stay short:
 *   helpers.roundRect(ctx, x, y, w, h, r)
 *   helpers.shade(hexColor, amount)   // amount -1..1, darken/lighten
 *   helpers.defaultRender(ctx, rect, color)
 */
window.BlockSkins = (function () {
    'use strict';

    const registry = {};
    const order = [];
    let defaultId = null;

    /* ----- small drawing helpers shared by all skins ----- */

    function roundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // Lighten (amount > 0) or darken (amount < 0) a colour. Accepts #rgb, #rrggbb
    // or `hsl(...)`. For hsl we tweak the lightness; for hex we mix toward
    // white/black.
    function shade(color, amount) {
        if (typeof color === 'string' && color.indexOf('hsl') === 0) {
            const m = color.match(/hsl\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i);
            if (m) {
                const h = parseFloat(m[1]);
                const s = parseFloat(m[2]);
                let l = parseFloat(m[3]) + amount * 100;
                l = Math.max(0, Math.min(100, l));
                return `hsl(${h} ${s}% ${l}%)`;
            }
        }
        const rgb = hexToRgb(color);
        if (!rgb) return color;
        const t = amount < 0 ? 0 : 255;
        const p = Math.abs(amount);
        const mix = (c) => Math.round((t - c) * p + c);
        return `rgb(${mix(rgb.r)}, ${mix(rgb.g)}, ${mix(rgb.b)})`;
    }

    function hexToRgb(hex) {
        if (typeof hex !== 'string') return null;
        let h = hex.trim().replace('#', '');
        if (h.length === 3) h = h.split('').map((c) => c + c).join('');
        if (h.length !== 6) return null;
        const n = parseInt(h, 16);
        if (Number.isNaN(n)) return null;
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    /* ----- the default block renderer (rounded gradient + highlight) ----- */

    function defaultRender(ctx, rect, color) {
        const { x, y, w, h } = rect;
        const radius = Math.min(8, h * 0.28);

        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, shade(color, 0.18));
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, shade(color, -0.22));

        roundRect(ctx, x, y, w, h, radius);
        ctx.fillStyle = grad;
        ctx.fill();

        // glossy top edge
        roundRect(ctx, x + 2, y + 2, Math.max(0, w - 4), Math.max(0, h * 0.34), radius * 0.6);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fill();

        // subtle outline for definition
        roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, radius);
        ctx.lineWidth = 1;
        ctx.strokeStyle = shade(color, -0.4);
        ctx.stroke();
    }

    const helpers = { roundRect, shade, defaultRender };

    /* ----- public API ----- */

    function register(skin) {
        if (!skin || !skin.id) return;
        if (!registry[skin.id]) order.push(skin.id);
        registry[skin.id] = skin;
        if (defaultId === null) defaultId = skin.id;
    }

    function setDefault(id) {
        if (registry[id]) defaultId = id;
    }

    function get(id) {
        return registry[id] || registry[defaultId];
    }

    function list() {
        return order.map((id) => registry[id]);
    }

    // Draw a block. `rect` = {x, y, w, h}. `index` is the block's height in the
    // tower (0 = bottom), letting skins vary colour as the tower grows.
    function draw(ctx, rect, index, skinId) {
        const skin = get(skinId);
        if (skin.render) {
            skin.render(ctx, rect, index, helpers);
        } else {
            const color = skin.colorFor ? skin.colorFor(index) : '#888';
            defaultRender(ctx, rect, color);
        }
    }

    /* ===================================================================== *
     *  Built-in skins. Add your own by calling BlockSkins.register({...}).
     * ===================================================================== */

    /* --------------------------------------------------------------------- *
     *  Apeldoorn façades — Dutch row-house fronts wrapped in scaffolding.
     *  Each block is rendered as a random façade so a tower reads like a
     *  street of houses under construction. Façades are drawn once into
     *  offscreen canvases (in a 200x160 design space) and blitted per block.
     * --------------------------------------------------------------------- */

    const FACADE_W = 200, FACADE_H = 160;

    // ---- shared façade parts ----

    function drawBrick(ctx, x, y, w, h) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.fillStyle = '#b15c44';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(231, 216, 196, 0.8)';
        ctx.lineWidth = 0.8;
        const bh = 8, bw = 24;
        for (let yy = y; yy <= y + h; yy += bh) {
            ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
        }
        let row = 0;
        for (let yy = y; yy < y + h; yy += bh) {
            const off = (row % 2) ? bw / 2 : 0;
            for (let xx = x + off; xx <= x + w; xx += bw) {
                ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + bh); ctx.stroke();
            }
            row++;
        }
        ctx.restore();
    }

    function drawSash(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x, y);
        roundRect(ctx, 0, 0, w, h, 1.5);
        ctx.fillStyle = '#f4efe4';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#3a2b22';
        ctx.stroke();
        ctx.fillStyle = '#aecbe0';
        ctx.fillRect(w * 0.13, h * 0.09, w * 0.74, h * 0.82);
        ctx.strokeStyle = '#f4efe4';
        ctx.lineWidth = Math.max(1, w * 0.08);
        ctx.beginPath();
        ctx.moveTo(w / 2, h * 0.09); ctx.lineTo(w / 2, h * 0.91);
        ctx.moveTo(w * 0.13, h / 2); ctx.lineTo(w * 0.87, h / 2);
        ctx.stroke();
        ctx.restore();
    }

    function drawDoor(ctx, x, y, w, h) {
        ctx.save();
        ctx.translate(x, y);
        const fan = h * 0.16;
        ctx.fillStyle = '#aecbe0';
        roundRect(ctx, 0, 0, w, fan, 1.5); ctx.fill();
        ctx.fillStyle = '#2f6b4f';
        roundRect(ctx, 0, fan, w, h - fan, 1.5); ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = '#1e4633';
        roundRect(ctx, 0, 0, w, h, 1.5); ctx.stroke();
        ctx.fillStyle = '#27583f';
        const pw = w * 0.3, ph = (h - fan) * 0.32;
        ctx.fillRect(w * 0.12, fan + ph * 0.4, pw, ph);
        ctx.fillRect(w * 0.58, fan + ph * 0.4, pw, ph);
        ctx.fillRect(w * 0.12, fan + ph * 1.7, pw, ph);
        ctx.fillRect(w * 0.58, fan + ph * 1.7, pw, ph);
        ctx.fillStyle = '#e6c14d';
        ctx.beginPath(); ctx.arc(w * 0.8, h * 0.55, w * 0.05, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    function drawScaffold(ctx) {
        // working platforms (planks)
        ctx.fillStyle = '#c8a164';
        ctx.strokeStyle = '#a9824a';
        ctx.lineWidth = 0.8;
        [84, 134].forEach((yy) => { ctx.fillRect(4, yy, 192, 7); ctx.strokeRect(4, yy, 192, 7); });
        // diagonal braces
        ctx.strokeStyle = '#b7bfc6';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(12, 138); ctx.lineTo(100, 88);
        ctx.moveTo(100, 88); ctx.lineTo(188, 40);
        ctx.stroke();
        // horizontal ledgers
        ctx.strokeStyle = '#aab2b9';
        ctx.lineWidth = 2.4;
        [40, 88, 138].forEach((yy) => {
            ctx.beginPath(); ctx.moveTo(6, yy); ctx.lineTo(194, yy); ctx.stroke();
        });
        // standards (vertical poles) — same x on every block so towers line up
        ctx.strokeStyle = '#9aa3ab';
        ctx.lineWidth = 3;
        [12, 100, 188].forEach((xx) => {
            ctx.beginPath(); ctx.moveTo(xx, 2); ctx.lineTo(xx, 158); ctx.stroke();
        });
        // couplers
        ctx.fillStyle = '#7f878e';
        [12, 100, 188].forEach((xx) => [40, 88, 138].forEach((yy) => {
            ctx.beginPath(); ctx.arc(xx, yy, 2.2, 0, Math.PI * 2); ctx.fill();
        }));
    }

    function steppedGablePath(ctx) {
        ctx.beginPath();
        ctx.moveTo(50, 46); ctx.lineTo(50, 34); ctx.lineTo(66, 34); ctx.lineTo(66, 24);
        ctx.lineTo(84, 24); ctx.lineTo(84, 14); ctx.lineTo(116, 14); ctx.lineTo(116, 24);
        ctx.lineTo(134, 24); ctx.lineTo(134, 34); ctx.lineTo(150, 34); ctx.lineTo(150, 46);
        ctx.closePath();
    }

    function roofPath(ctx) {
        ctx.beginPath();
        ctx.moveTo(8, 58); ctx.lineTo(52, 10); ctx.lineTo(148, 10); ctx.lineTo(192, 58);
        ctx.closePath();
    }

    // ---- the five façade variants (Het Loo intentionally excluded) ----

    function facadeBrickCourse(ctx) {
        drawBrick(ctx, 0, 0, 200, 160);
        ctx.fillStyle = '#8f4632'; ctx.fillRect(0, 0, 200, 10);
        ctx.fillStyle = '#cdbfa9'; ctx.fillRect(0, 74, 200, 9);
        ctx.fillStyle = '#7d3e2c'; ctx.fillRect(0, 150, 200, 10);
        [22, 83, 144].forEach((x) => drawSash(ctx, x, 20, 34, 48));
        [22, 83, 144].forEach((x) => drawSash(ctx, x, 96, 34, 48));
    }

    function facadeSteppedGable(ctx) {
        drawBrick(ctx, 0, 46, 200, 114);
        ctx.fillStyle = '#7d3e2c'; ctx.fillRect(0, 150, 200, 10);
        ctx.save(); steppedGablePath(ctx); ctx.clip(); drawBrick(ctx, 0, 0, 200, 60); ctx.restore();
        ctx.save(); steppedGablePath(ctx); ctx.lineWidth = 3; ctx.strokeStyle = '#f1ece1';
        ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
        ctx.fillStyle = '#6b4a33'; ctx.fillRect(96, 2, 8, 15);
        ctx.beginPath(); ctx.arc(100, 4, 3, 0, Math.PI * 2); ctx.fill();
        drawSash(ctx, 84, 22, 32, 20);
        drawSash(ctx, 34, 64, 34, 48);
        drawSash(ctx, 132, 64, 34, 48);
    }

    function facadeGroundFloor(ctx) {
        drawBrick(ctx, 0, 0, 200, 160);
        ctx.fillStyle = '#8f4632'; ctx.fillRect(0, 0, 200, 10);
        ctx.fillStyle = '#5f5a52'; ctx.fillRect(0, 150, 200, 10);
        drawSash(ctx, 40, 22, 34, 44);
        drawSash(ctx, 126, 22, 34, 44);
        drawSash(ctx, 22, 74, 40, 56);
        drawSash(ctx, 138, 74, 40, 56);
        ctx.fillStyle = '#cdbfa9'; ctx.fillRect(74, 56, 52, 8);
        drawDoor(ctx, 78, 62, 44, 88);
    }

    function facadeTiledRoof(ctx) {
        drawBrick(ctx, 0, 58, 200, 102);
        ctx.fillStyle = '#7d3e2c'; ctx.fillRect(0, 150, 200, 10);
        roofPath(ctx);
        ctx.fillStyle = '#d97a3c'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#a85626'; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.save(); roofPath(ctx); ctx.clip();
        ctx.strokeStyle = '#b9602c'; ctx.lineWidth = 1.4;
        [22, 34, 46].forEach((yy) => { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(200, yy); ctx.stroke(); });
        ctx.restore();
        ctx.beginPath(); ctx.moveTo(86, 30); ctx.lineTo(100, 16); ctx.lineTo(114, 30); ctx.closePath();
        ctx.fillStyle = '#d97a3c'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#a85626'; ctx.stroke();
        drawBrick(ctx, 88, 30, 24, 20);
        drawSash(ctx, 92, 32, 16, 18);
        drawSash(ctx, 34, 74, 34, 48);
        drawSash(ctx, 132, 74, 34, 48);
    }

    function facadeBellGable(ctx) {
        drawBrick(ctx, 0, 50, 200, 110);
        ctx.fillStyle = '#7d3e2c'; ctx.fillRect(0, 150, 200, 10);
        ctx.beginPath();
        ctx.moveTo(28, 50); ctx.lineTo(28, 40);
        ctx.bezierCurveTo(28, 28, 40, 23, 58, 22);
        ctx.bezierCurveTo(68, 11, 132, 11, 142, 22);
        ctx.bezierCurveTo(160, 23, 172, 28, 172, 40);
        ctx.lineTo(172, 50); ctx.closePath();
        ctx.fillStyle = '#efe9dd'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#cdbfa9'; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.beginPath(); ctx.arc(100, 32, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#aecbe0'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#cdbfa9'; ctx.stroke();
        ctx.beginPath(); ctx.arc(100, 9, 4, 0, Math.PI * 2); ctx.fillStyle = '#cdbfa9'; ctx.fill();
        drawSash(ctx, 34, 64, 34, 48);
        drawSash(ctx, 132, 64, 34, 48);
        drawSash(ctx, 83, 96, 34, 46);
    }

    const facadeDrawers = [
        facadeBrickCourse, facadeSteppedGable, facadeGroundFloor,
        facadeTiledRoof, facadeBellGable,
    ];

    // Lazily pre-render each façade (with scaffolding) into an offscreen canvas.
    let facadeCache = null;
    function buildFacadeCache() {
        if (facadeCache || typeof document === 'undefined') return facadeCache;
        const scale = 2; // supersample for crisp downscaling onto small blocks
        facadeCache = facadeDrawers.map((fn) => {
            const c = document.createElement('canvas');
            c.width = FACADE_W * scale;
            c.height = FACADE_H * scale;
            const cx = c.getContext('2d');
            cx.scale(scale, scale);
            fn(cx);
            drawScaffold(cx);
            return c;
        });
        return facadeCache;
    }

    // Stable per-block pseudo-random pick (so a block keeps its façade across
    // frames instead of flickering).
    function facadeVariant(index) {
        let h = ((index + 1) * 374761393) >>> 0;
        h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
        return (h >>> 0) % facadeDrawers.length;
    }

    register({
        id: 'apeldoorn',
        name: 'Apeldoorn',
        swatch: '#b15c44',
        // colour used by the menu preview (which is plain HTML, not canvas)
        colorFor(i) {
            const t = ['#b15c44', '#b96149', '#a8503f', '#bd6650', '#a85436'];
            return t[i % t.length];
        },
        render(ctx, rect, index, h) {
            const cache = buildFacadeCache();
            const v = facadeVariant(index);
            if (cache && cache[v]) {
                ctx.drawImage(cache[v], rect.x, rect.y, rect.w, rect.h);
            } else {
                h.defaultRender(ctx, rect, '#b15c44'); // no-canvas fallback
            }
        },
    });

    register({
        id: 'spectrum',
        name: 'Spectrum',
        swatch: 'hsl(210 70% 55%)',
        colorFor(i) { return `hsl(${(200 + i * 22) % 360} 68% 56%)`; },
    });

    register({
        id: 'sunset',
        name: 'Sunset',
        swatch: '#ff7e5f',
        colorFor(i) {
            const stops = ['#ff7e5f', '#feb47b', '#ff5f6d', '#ffc371', '#f56960'];
            return stops[i % stops.length];
        },
    });

    register({
        id: 'ocean',
        name: 'Ocean',
        swatch: '#2bd2c2',
        colorFor(i) {
            const stops = ['#1a9bb5', '#23c6b6', '#2bd2c2', '#1f7fb3', '#3fb6d6'];
            return stops[i % stops.length];
        },
    });

    register({
        id: 'mono',
        name: 'Slate',
        swatch: '#5a6472',
        colorFor(i) {
            const shadeLevel = 38 + (i % 5) * 7;
            return `hsl(215 12% ${shadeLevel}%)`;
        },
    });

    // A fully custom skin: candy stripes drawn with the `render` hook. This is
    // the template to copy when you want a look the default renderer can't give.
    register({
        id: 'candy',
        name: 'Candy',
        swatch: '#ff5d9e',
        render(ctx, rect, index, h) {
            const { x, y, w } = rect;
            const height = rect.h;
            const base = ['#ff5d9e', '#5d9bff'][index % 2];
            h.defaultRender(ctx, rect, base);
            // diagonal stripes clipped to the block
            ctx.save();
            h.roundRect(ctx, x, y, w, height, Math.min(8, height * 0.28));
            ctx.clip();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 6;
            for (let i = -height; i < w + height; i += 16) {
                ctx.beginPath();
                ctx.moveTo(x + i, y);
                ctx.lineTo(x + i + height, y + height);
                ctx.stroke();
            }
            ctx.restore();
        },
    });

    return { register, setDefault, get, list, draw, helpers };
})();
