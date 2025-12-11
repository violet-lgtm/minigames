# ⚡ Wire Puzzle Game

A web-based puzzle game where you rotate tiles with wires to connect a power source to lights. Features 8 built-in levels and a fully functional level editor for creating custom puzzles!

## 🎮 How to Play

1. Open `index.html` in your web browser
2. Click **Play Game** to start with built-in levels
3. Click on tiles to rotate them 90 degrees
4. Connect the power source (⚡) to the light (💡) to win!
5. Try to solve each level in the minimum number of moves

## 🎯 Features

### Game Player (`game.html`)
- **8 Built-in Levels**: Progressive difficulty from tutorial to expert
- **Level Selection**: Browse and select levels
- **Move Counter**: Track your efficiency
- **Win Detection**: Automatic celebration when you solve a puzzle
- **Reset Function**: Start over anytime
- **Custom Level Support**: Play user-created levels

### Level Editor (`editor.html`)
- **Visual Editor**: Click to place tiles on a grid
- **Multiple Tile Types**:
  - Power Source (⚡) - Where electricity starts
  - Light (💡) - Goal destination
  - Straight Wire (━) - Connects two opposite sides
  - Corner Wire (┗) - Turns 90 degrees
  - T-Junction (┣) - Connects three sides
  - Cross (+) - Connects all four sides
  - Bridge (╬) - Wire overpass where one wire goes over another
- **Tools**:
  - Place Mode: Click to add tiles
  - Rotate Mode: Click to rotate existing tiles
  - Erase Mode: Remove tiles
- **Grid Customization**: Adjust grid size (3x3 to 12x12)
- **Test Function**: Play your level instantly
- **Save/Load**: Store levels in browser localStorage
- **Import/Export**: Share levels as JSON files

## 🏗️ Architecture

### Separated Pages (Option 1 Design)
- `index.html` - Main menu and navigation
- `game.html` - Game player (works independently)
- `editor.html` - Level editor (works independently)

### Shared Core Engine (`js/core/`)
- `engine.js` - Game logic (tile connections, power flow, win detection)
- `renderer.js` - Canvas rendering system
- `storage.js` - LocalStorage management for custom levels
- `levels.js` - Built-in level definitions

### Game Logic Highlights

**Tile System**: Each tile has a type and rotation (0°, 90°, 180°, 270°). The engine calculates which sides have connections based on type and rotation.

**Power Propagation**: Uses Breadth-First Search (BFS) to flow power from the source through connected tiles.

**Connection Detection**: Tiles must have matching connection points to conduct power (e.g., a tile's right side must connect to the next tile's left side).

## 📁 File Structure

```
wire-puzzle/
├── index.html              # Main menu
├── game.html              # Game player
├── editor.html            # Level editor
├── js/
│   └── core/
│       ├── engine.js      # Game engine
│       ├── renderer.js    # Canvas renderer
│       ├── storage.js     # Level storage
│       └── levels.js      # Built-in levels
└── css/
    └── common.css         # Shared styles
```

## 🎨 Tile Types Reference

| Type | Symbol | Description | Connections |
|------|--------|-------------|-------------|
| Power | ⚡ | Power source (locked) | Right |
| Light | 💡 | Goal light (locked) | Left |
| Straight | ━ | Straight wire | Left-Right (or Top-Bottom when rotated) |
| Corner | ┗ | L-shaped wire | Top-Right (rotates) |
| T-Junction | ┣ | Three-way wire | Left-Top-Right (rotates) |
| Cross | + | Four-way wire | All sides |
| Bridge | ╬ | Wire overpass/underpass | Left-Right or Top-Bottom (only straight through) |

## 🔧 Creating Custom Levels

1. Open `editor.html`
2. Set grid size and level name
3. Click a tile type from the palette
4. Click on the grid to place tiles
5. **Requirements**:
   - Exactly one Power Source
   - At least one Light
   - Wire tiles to connect them
6. Click **Test Level** to play it immediately
7. Click **Save Level** to store it locally
8. Click **Export JSON** to share with others

## 🚀 Testing Workflow

The editor includes a seamless testing feature:
1. Create your level in the editor
2. Click **▶️ Test Level**
3. The level is temporarily stored and game.html opens
4. Play through your level
5. Use the **← Back to Levels** button to return to editor

## 💾 Level Storage

- **Built-in Levels**: Hardcoded in `levels.js`
- **Custom Levels**: Stored in browser LocalStorage
- **Test Levels**: Temporarily stored in SessionStorage
- **Export Format**: JSON files for sharing

## 🌐 Browser Compatibility

- Modern browsers with HTML5 Canvas support
- Chrome, Firefox, Safari, Edge (latest versions)
- No external dependencies required
- Works offline (no internet connection needed)

## 🎓 Level Design Tips

1. **Start Simple**: Begin with straight paths, then add complexity
2. **Red Herrings**: Add extra tiles that aren't part of the solution
3. **Multiple Paths**: Create puzzles with several possible solutions
4. **Symmetry**: Symmetric designs often look more polished
5. **Test Thoroughly**: Make sure your level is actually solvable!

## 📝 Level JSON Format

```json
{
  "id": "custom-123456789",
  "name": "My Level",
  "difficulty": "medium",
  "gridSize": { "width": 6, "height": 6 },
  "tiles": [
    { "type": "power", "x": 0, "y": 0, "rotation": 0, "locked": true },
    { "type": "straight", "x": 1, "y": 0, "rotation": 0 },
    { "type": "light", "x": 2, "y": 0, "rotation": 0, "locked": true }
  ]
}
```

## 🤝 Sharing Levels

1. **Export**: Use the Export button to download a `.json` file
2. **Share**: Send the file to friends
3. **Import**: They can use the Import button to load your level
4. **Play**: Your custom level appears in their editor and can be played!

## ⚙️ Technical Details

- **No Build Process**: Pure HTML/CSS/JavaScript
- **ES6 Modules**: Uses modern JavaScript module system
- **Canvas API**: For rendering the game grid
- **LocalStorage API**: For persistent level storage
- **SessionStorage API**: For test level temporary storage

## 🎯 Future Enhancement Ideas

- Online level sharing database
- Level rating system
- Time-based challenges
- Minimum move challenges
- Sound effects and music
- Mobile touch controls optimization
- Level categories/tags
- Undo/redo in game

## 📄 License

Free to use and modify for any purpose.

---

Made with ⚡ by Claude Code
