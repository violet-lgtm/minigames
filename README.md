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

## 🚀 GitHub Pages Setup

This repository is configured to automatically deploy to GitHub Pages. To enable it:

1. **Go to Repository Settings**
   - Navigate to your repository on GitHub
   - Click on "Settings" tab

2. **Enable GitHub Pages**
   - In the left sidebar, click "Pages"
   - Under "Build and deployment":
     - Source: Select "GitHub Actions"
   - Save the settings

3. **Merge to Main Branch**
   - The workflow runs automatically on pushes to `main` or `master` branch
   - You can also manually trigger it from the "Actions" tab

4. **Access Your Site**
   - After deployment completes, your games will be live at:
   - `https://violet-lgtm.github.io/minigames/`

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
