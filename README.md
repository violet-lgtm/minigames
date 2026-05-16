# 🎮 Minigames Collection

A collection of interactive browser-based mini games for stqry integration.

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
