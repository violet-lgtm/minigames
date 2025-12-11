// Wire Puzzle Renderer
export class Renderer {
    constructor(canvas, gridSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        this.cellSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;

        this.updateCanvasSize();
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
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid(tiles) {
        this.clear();

        // Draw grid background
        for (let y = 0; y < this.gridSize.height; y++) {
            for (let x = 0; x < this.gridSize.width; x++) {
                this.drawCell(x, y);
            }
        }

        // Draw tiles
        tiles.forEach(tile => {
            this.drawTile(tile);
        });
    }

    drawCell(x, y) {
        const px = this.offsetX + x * this.cellSize;
        const py = this.offsetY + y * this.cellSize;

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);
    }

    drawTile(tile) {
        const px = this.offsetX + tile.x * this.cellSize;
        const py = this.offsetY + tile.y * this.cellSize;

        this.ctx.save();
        this.ctx.translate(px + this.cellSize / 2, py + this.cellSize / 2);
        this.ctx.rotate((tile.rotation * Math.PI) / 180);

        // Draw tile background if powered
        if (tile.powered && tile.type !== 'empty') {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
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
        }

        this.ctx.restore();

        // Draw lock indicator
        if (tile.locked && tile.type !== 'power' && tile.type !== 'light') {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🔒', px + this.cellSize / 2, py + this.cellSize - 5);
        }
    }

    drawPowerSource(powered) {
        const size = this.cellSize * 0.4;

        // Draw lightning bolt
        this.ctx.fillStyle = powered ? '#FFD700' : '#666';
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
        this.ctx.strokeStyle = powered ? '#FFD700' : '#666';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.cellSize / 2, 0);
        this.ctx.stroke();
    }

    drawLight(powered) {
        const radius = this.cellSize * 0.3;

        // Draw bulb
        this.ctx.fillStyle = powered ? '#FFD700' : '#444';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw glow if powered
        if (powered) {
            const gradient = this.ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.5);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw connection wire
        this.ctx.strokeStyle = powered ? '#FFD700' : '#666';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.cellSize / 2, 0);
        this.ctx.lineTo(0, 0);
        this.ctx.stroke();
    }

    drawStraight(powered) {
        this.ctx.strokeStyle = powered ? '#FFD700' : '#666';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.cellSize / 2, 0);
        this.ctx.lineTo(this.cellSize / 2, 0);
        this.ctx.stroke();
    }

    drawCorner(powered) {
        this.ctx.strokeStyle = powered ? '#FFD700' : '#666';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.cellSize / 2);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(this.cellSize / 2, 0);
        this.ctx.stroke();
    }

    drawTJunction(powered) {
        this.ctx.strokeStyle = powered ? '#FFD700' : '#666';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.cellSize / 2, 0);
        this.ctx.lineTo(this.cellSize / 2, 0);
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -this.cellSize / 2);
        this.ctx.stroke();
    }

    drawCross(powered) {
        this.ctx.strokeStyle = powered ? '#FFD700' : '#666';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.cellSize / 2, 0);
        this.ctx.lineTo(this.cellSize / 2, 0);
        this.ctx.moveTo(0, -this.cellSize / 2);
        this.ctx.lineTo(0, this.cellSize / 2);
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
}
