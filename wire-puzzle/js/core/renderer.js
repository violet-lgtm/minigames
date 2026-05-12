// Wire Puzzle Renderer
export class Renderer {
    constructor(canvas, gridSize, tileTheme = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        this.cellSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;

        // Default theme for tiles
        this.tileTheme = tileTheme || {
            wirePowered: '#FFD700',
            wireUnpowered: '#666',
            gridLine: '#333',
            canvasBg: '#1a1a1a',
            poweredGlow: 'rgba(255, 215, 0, 0.1)',
            lockIcon: '#fff',
            railTrack: 'rgba(102, 126, 234, 0.4)',
            railCap: 'rgba(102, 126, 234, 0.6)',
            draggableBorder: 'rgba(102, 126, 234, 0.8)'
        };

        this.updateCanvasSize();
    }

    setTheme(tileTheme) {
        this.tileTheme = tileTheme;
    }

    updateCanvasSize() {
        const maxSize = Math.min(this.canvas.width, this.canvas.height);
        const gridMax = Math.max(this.gridSize.width, this.gridSize.height);
        this.cellSize = Math.floor(maxSize / gridMax) - 2;

        // Center the grid
        this.offsetX = (this.canvas.width - this.gridSize.width * this.cellSize) / 2;
        this.offsetY = (this.canvas.height - this.gridSize.height * this.cellSize) / 2;
    }

    clear() {
        this.ctx.fillStyle = this.tileTheme.canvasBg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid(tiles, rails = [], engine = null) {
        this.clear();

        // Draw grid background
        for (let y = 0; y < this.gridSize.height; y++) {
            for (let x = 0; x < this.gridSize.width; x++) {
                this.drawCell(x, y);
            }
        }

        // Draw rails
        rails.forEach(rail => {
            this.drawRail(rail);
        });

        // Draw tiles
        tiles.forEach(tile => {
            this.drawTile(tile, engine);
        });

        // Draw draggable indicators on top
        tiles.forEach(tile => {
            if (tile.railId) {
                this.drawDraggableIndicator(tile);
            }
        });
    }

    drawCell(x, y) {
        const px = this.offsetX + x * this.cellSize;
        const py = this.offsetY + y * this.cellSize;

        this.ctx.strokeStyle = this.tileTheme.gridLine;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);
    }

    drawTile(tile, engine = null) {
        const px = this.offsetX + tile.x * this.cellSize;
        const py = this.offsetY + tile.y * this.cellSize;

        this.ctx.save();
        this.ctx.translate(px + this.cellSize / 2, py + this.cellSize / 2);
        this.ctx.rotate((tile.rotation * Math.PI) / 180);

        // Draw tile background if powered
        if (tile.powered && tile.type !== 'empty') {
            this.ctx.fillStyle = this.tileTheme.poweredGlow;
            this.ctx.fillRect(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize);
        }

        // Draw based on type
        switch (tile.type) {
            case 'power':
                this.drawPowerSource(tile.powered);
                break;
            case 'light':
                this.drawLight(tile.powered);
                break;
            case 'straight':
                this.drawStraight(tile.powered);
                break;
            case 'corner':
                this.drawCorner(tile.powered);
                break;
            case 't-junction':
                this.drawTJunction(tile.powered);
                break;
            case 'cross':
                this.drawCross(tile.powered);
                break;
            case 'bridge':
                this.drawBridge(tile.powered, tile, engine);
                break;
        }

        this.ctx.restore();

        // Draw lock indicator
        if (tile.locked && tile.type !== 'power' && tile.type !== 'light') {
            this.ctx.fillStyle = this.tileTheme.lockIcon;
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🔒', px + this.cellSize / 2, py + this.cellSize - 5);
        }
    }

    drawPowerSource(powered) {
        const size = this.cellSize * 0.4;

        // Draw lightning bolt
        this.ctx.fillStyle = powered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.2, -size);
        this.ctx.lineTo(size * 0.2, -size * 0.2);
        this.ctx.lineTo(-size * 0.1, -size * 0.2);
        this.ctx.lineTo(size * 0.2, size);
        this.ctx.lineTo(-size * 0.2, size * 0.2);
        this.ctx.lineTo(size * 0.1, size * 0.2);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw connection wire
        this.ctx.strokeStyle = powered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.cellSize / 2, 0);
        this.ctx.stroke();
    }

    drawLight(powered) {
        const radius = this.cellSize * 0.3;

        // Draw bulb
        this.ctx.fillStyle = powered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw glow if powered
        if (powered) {
            const gradient = this.ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.5);
            // Use powered glow color from theme
            const glowColor = this.tileTheme.poweredGlow;
            gradient.addColorStop(0, glowColor.replace(/[\d.]+\)$/g, '0.5)'));
            gradient.addColorStop(1, glowColor.replace(/[\d.]+\)$/g, '0)'));
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw connection wire
        this.ctx.strokeStyle = powered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.cellSize / 2, 0);
        this.ctx.lineTo(0, 0);
        this.ctx.stroke();
    }

    drawStraight(powered) {
        this.ctx.strokeStyle = powered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.cellSize / 2, 0);
        this.ctx.lineTo(this.cellSize / 2, 0);
        this.ctx.stroke();
    }

    drawCorner(powered) {
        this.ctx.strokeStyle = powered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.cellSize / 2);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(this.cellSize / 2, 0);
        this.ctx.stroke();
    }

    drawTJunction(powered) {
        this.ctx.strokeStyle = powered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.cellSize / 2, 0);
        this.ctx.lineTo(this.cellSize / 2, 0);
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -this.cellSize / 2);
        this.ctx.stroke();
    }

    drawCross(powered) {
        this.ctx.strokeStyle = powered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.cellSize / 2, 0);
        this.ctx.lineTo(this.cellSize / 2, 0);
        this.ctx.moveTo(0, -this.cellSize / 2);
        this.ctx.lineTo(0, this.cellSize / 2);
        this.ctx.stroke();
    }

    drawBridge(powered, tile, engine) {
        const gap = this.cellSize * 0.15;
        const halfSize = this.cellSize / 2;

        this.ctx.lineWidth = 4;

        // Determine which specific wire segments should be powered
        let leftPowered = false;
        let rightPowered = false;
        let topPowered = false;
        let bottomPowered = false;

        if (powered && tile && tile.powerDirections && engine) {
            // Convert absolute directions to tile-relative directions based on rotation
            const rotation = tile.rotation || 0;
            const rotationSteps = rotation / 90;

            // Helper to rotate direction back to tile's local coordinate system
            const rotateDirectionInverse = (dir, steps) => {
                const dirs = ['top', 'right', 'bottom', 'left'];
                const index = dirs.indexOf(dir);
                if (index === -1) return dir;
                // Rotate backwards (counter-clockwise) to get tile-relative direction
                const newIndex = (index - steps + 4) % 4;
                return dirs[newIndex];
            };

            // Check each power direction and convert to tile-relative
            for (const dir of tile.powerDirections) {
                const localDir = rotateDirectionInverse(dir, rotationSteps);

                if (localDir === 'left' || localDir === 'right') {
                    // Horizontal wire is powered
                    leftPowered = true;
                    rightPowered = true;
                }
                if (localDir === 'top' || localDir === 'bottom') {
                    // Vertical wire is powered
                    topPowered = true;
                    bottomPowered = true;
                }
            }
        }

        // Draw vertical wire segments with gap (goes "under")
        // Top segment
        this.ctx.strokeStyle = topPowered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -halfSize);
        this.ctx.lineTo(0, -gap);
        this.ctx.stroke();

        // Bottom segment
        this.ctx.strokeStyle = bottomPowered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.beginPath();
        this.ctx.moveTo(0, gap);
        this.ctx.lineTo(0, halfSize);
        this.ctx.stroke();

        // Draw horizontal wire segments (on top, continuous line)
        // Left segment
        this.ctx.strokeStyle = leftPowered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.beginPath();
        this.ctx.moveTo(-halfSize, 0);
        this.ctx.lineTo(0, 0);
        this.ctx.stroke();

        // Right segment
        this.ctx.strokeStyle = rightPowered ? this.tileTheme.wirePowered : this.tileTheme.wireUnpowered;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(halfSize, 0);
        this.ctx.stroke();
    }

    // Convert screen coordinates to grid coordinates
    screenToGrid(screenX, screenY) {
        const gridX = Math.floor((screenX - this.offsetX) / this.cellSize);
        const gridY = Math.floor((screenY - this.offsetY) / this.cellSize);

        if (gridX < 0 || gridX >= this.gridSize.width || gridY < 0 || gridY >= this.gridSize.height) {
            return null;
        }

        return { x: gridX, y: gridY };
    }

    // Highlight a cell (used in editor)
    highlightCell(x, y, color = 'rgba(255, 255, 255, 0.3)') {
        const px = this.offsetX + x * this.cellSize;
        const py = this.offsetY + y * this.cellSize;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
    }

    // Draw a rail track
    drawRail(rail) {
        this.ctx.strokeStyle = this.tileTheme.railTrack;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        if (rail.type === 'horizontal') {
            const y = this.offsetY + rail.y * this.cellSize + this.cellSize / 2;
            const x1 = this.offsetX + rail.xMin * this.cellSize + this.cellSize / 2;
            const x2 = this.offsetX + rail.xMax * this.cellSize + this.cellSize / 2;

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y);
            this.ctx.lineTo(x2, y);
            this.ctx.stroke();

            // Draw end caps
            this.ctx.setLineDash([]);
            this.ctx.fillStyle = this.tileTheme.railCap;
            this.ctx.fillRect(x1 - 3, y - 8, 6, 16);
            this.ctx.fillRect(x2 - 3, y - 8, 6, 16);
        } else if (rail.type === 'vertical') {
            const x = this.offsetX + rail.x * this.cellSize + this.cellSize / 2;
            const y1 = this.offsetY + rail.yMin * this.cellSize + this.cellSize / 2;
            const y2 = this.offsetY + rail.yMax * this.cellSize + this.cellSize / 2;

            this.ctx.beginPath();
            this.ctx.moveTo(x, y1);
            this.ctx.lineTo(x, y2);
            this.ctx.stroke();

            // Draw end caps
            this.ctx.setLineDash([]);
            this.ctx.fillStyle = this.tileTheme.railCap;
            this.ctx.fillRect(x - 8, y1 - 3, 16, 6);
            this.ctx.fillRect(x - 8, y2 - 3, 16, 6);
        }

        this.ctx.setLineDash([]);
    }

    // Draw draggable indicator on tile
    drawDraggableIndicator(tile) {
        const px = this.offsetX + tile.x * this.cellSize;
        const py = this.offsetY + tile.y * this.cellSize;

        // Draw subtle border
        this.ctx.strokeStyle = this.tileTheme.draggableBorder;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);

        // Draw drag icon in corner
        this.ctx.fillStyle = this.tileTheme.draggableBorder;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('⇄', px + this.cellSize - 4, py + this.cellSize - 4);
    }
}
