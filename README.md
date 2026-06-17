# 🎮 Minigames Collection

A collection of interactive browser-based mini games for stqry integration.

## 🧩 Custom Levels & Standalone Pages

Every game has a level creator, and every created level can be exported as a
**standalone web page**: a single self-contained HTML file (game + level baked
in) that can be hosted anywhere on its own — independent of this site.

- **Wire Puzzle / Mastermind** — full level editors (`editor.html`)
- **Truck Jam** — visual yard editor with a built-in solvability check (`editor.html`)
- **Block Stacker** — challenge creator: goal height, speeds, skin, win message (`editor.html`)
- **Reaction Slots** — round designer: your own symbols, reels and speeds (`editor.html`)
- **Paper Puzzle** — custom puzzle creator from any image (`custom.html`)

Each creator offers **🔗 Copy Share Link** (plays on this site) and
**📦 Download Standalone Page** (a single `.html` file you can upload to any
web server or CMS as its own page). The export bundles the game's CSS and
JavaScript and the level data into one file, so it needs no other assets.

## 🧭 Trails: string games together with a final score overview

The [Trail Builder](trail/builder.html) chains any mix of minigames (built-in
levels, presets, or pasted editor share-links) into a **trail** and generates:

- **one link per game** — opening it (e.g. from a stqry screen or QR code)
  drops the player straight into that game with the trail attached. A trail
  bar shows progress and an in-game scores overlay. Custom puzzle photos are
  kept out of the link: the builder extracts them to `trail/assets/` (offered
  as a small zip to commit) and the link references them by path, so every
  game's sub-URL stays short.
- **an overview link** (`trail/results.html`) — live progress, per-game
  points/stars/stats, the running total, and a celebration screen with a
  final score once every game is done.
- **a standalone trail** (📦 Download Trail (.zip)) — a zip containing a
  folder of separate, independently-hostable pages: `index.html` (the
  overview/final score) plus one self-contained HTML file per game, with any
  images written as their own compressed files under `assets/` (no base64
  inflation). Host the folder anywhere, or upload each page as its own stqry
  screen/link. Pages share scores through the stqry storage bridge — same
  origin over HTTP, or the app's storage inside its WebView — and navigate
  via ordinary links baked into each page (`shared/trail-standalone.js`,
  zipped with `shared/zip.js`).

Trails can be played **in any order** (every link works any time) or in a
**set order** (games stay locked until the previous one is finished).

Scores are saved through `shared/stqry-bridge.js` (the STQRY storage bridge
from [maxdammers/cookietest](https://github.com/maxdammers/cookietest)): it
uses `stqry.storage` over `postMessage` inside the stqry app's WebView and
falls back to `localStorage` in a normal browser, so trails work identically
in the app and on the web. Games report a normalised 0–100 score plus 1–3
stars on their win screen (`shared/chain.js`); replaying keeps the best.

## 🌐 Live Demo

Once GitHub Pages is enabled, the games will be available at:
**https://violet-lgtm.github.io/minigames/**

## 🎯 Available Games

### ⚡ Wire Puzzle
A brain-teasing puzzle game where you rotate tiles with wires to connect a power source to lights.

**Features:**
- 8 built-in levels with progressive difficulty
- Full-featured level editor
- Custom level creation and sharing
- Import/Export levels as JSON
- Test levels instantly

**Play:** [Wire Puzzle](wire-puzzle/index.html)

### 🧠 Mastermind
A classic codebreaking game where you deduce a hidden colour code from feedback pips.

**Features:**
- 6 built-in levels from beginner to grandmaster
- Highly customisable: code length, colour count, guess limit, duplicates
- Custom pip shapes (circle, star, heart, diamond, hexagon and more)
- Custom per-level win messages
- Full level editor supporting random or fixed (set) solutions
- Import/Export levels as JSON and share via link

**Play:** [Mastermind](mastermind/index.html)

### 🎰 Reaction Slots
A reaction-time test disguised as a slot machine — stop each of three spinning reels the instant the lucky 7 crosses the payline.

**Features:**
- Three reels that each spin faster than the last
- Millisecond-accurate timing with PERFECT / GREAT / GOOD ratings
- Land a symbol next to the goal for partial NEAR credit
- Hit the goal on multiple reels for a ×2 / ×3 combo multiplier
- Snap-to-symbol stop for a satisfying, tidy finish
- Tracks your best score locally
- Available in English, Dutch and German with an in-game language picker
- Play with a tap, click, or the spacebar
- Round designer: choose your own symbols, goal, reel count and speeds, then share a link or export a standalone page

**Play:** [Reaction Slots](slot-reaction/index.html)

### 🧱 Block Stacker
A timing game where a square block slides back and forth at the very top of the screen — drop it to fall onto the tower and stack as high as you can before you miss.

**Features:**
- The block slides left/right at the top; tap, click or press Space to drop it straight down onto the stack
- Every block keeps its full size to stand on — no slicing, so you only fail on a complete miss
- Each successful drop makes the next block slide back and forth faster
- Land a perfect line-up to snap flush and build a combo
- The camera scrolls upward as your tower climbs, leaving open sky for the drop
- Missed blocks tumble past the tower with a little physics flourish
- Swappable block styles (Spectrum, Sunset, Ocean, Slate, Candy) with a simple registry for adding your own
- Tracks your best height locally
- Challenge creator: set a goal height, speeds, block style and win message, then share a link or export a standalone page

**Play:** [Block Stacker](block-stack/index.html)

**Customising block looks:** all rendering lives in `block-stack/js/blocks.js`. Register a new skin with `BlockSkins.register({ id, name, colorFor(index) })` for a recoloured block, or supply a `render(ctx, rect, index, helpers)` function for a fully custom look (patterns, emoji, images). New skins appear automatically in the menu's style picker.

### 🚛 Truck Jam
A "parking slide" puzzle (the Rush Hour family) themed with cab-over European lorries — slide the trucks out of the way to clear a lane so your red lorry can roll out the depot's exit gate.

**Features:**
- 8 hand-tuned yards, every one verified solvable by a built-in BFS solver
- Difficulty graded by optimal move count, from a 2-move warm-up to a 16-move deadlock
- Trucks slide only along their own length — drag with a finger or the mouse
- Three-star scoring that rewards matching each yard's optimal "par"
- Stuck? The same solver powers a hint that shows your next move
- Tracks your best move count per yard locally and remembers cleared yards
- Yard editor: lay out your own jam, with the solver verifying it and setting par; share a link or export a standalone page

**Play:** [Truck Jam](truck-jam/index.html)

### Workflow Details

The `.github/workflows/deploy-pages.yml` workflow:
- Triggers on pushes to main/master branch
- Can be manually triggered from Actions tab
- Deploys the entire repository to GitHub Pages
- No build step needed - pure HTML/CSS/JavaScript

## 📁 Project Structure

```
minigames/
├── index.html                 # Landing page with game list
├── .nojekyll                 # Prevents Jekyll processing
├── .github/
│   └── workflows/
│       └── deploy-pages.yml  # GitHub Pages deployment
├── shared/
│   ├── standalone.js         # Standalone-page exporter used by all level editors
│   ├── stqry-bridge.js       # STQRY storage bridge (localStorage/postMessage/WebView)
│   ├── chain.js              # Trail runtime: score saving + progress bar in each game
│   ├── trail-standalone.js   # Builds a downloadable multi-file trail (hub + pages + assets)
│   └── zip.js                # Tiny dependency-free ZIP writer (store method)
├── trail/
│   ├── builder.html          # Chain games into a trail; hosted links or downloadable zip
│   └── results.html          # Live overview + final score page (hosted links)
└── wire-puzzle/              # Wire Puzzle game
    ├── index.html            # Game menu
    ├── game.html            # Game player
    ├── editor.html          # Level editor
    ├── js/core/             # Shared game engine
    └── css/                 # Styles
```

## 🛠️ Development

All games are built with vanilla HTML, CSS, and JavaScript - no build process required!

**To add a new game:**
1. Create a new directory for your game
2. Add your HTML/CSS/JS files
3. Update the main `index.html` to include your game card
4. Push to main branch - GitHub Actions handles the rest!

## 📝 Local Testing

Simply open `index.html` in your browser to test locally. All games work offline without any server setup.

## 🤝 Contributing

Feel free to add more games to this collection! Each game should:
- Be self-contained in its own directory
- Work without external dependencies
- Include a README with instructions
- Have a responsive design for mobile/desktop

## 📄 License

Open source - free to use and modify.

---

Built for stqry integration
