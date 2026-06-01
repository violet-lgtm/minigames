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
