// Wire Puzzle Game Engine
export class GameEngine {
    constructor(level) {
        this.level = JSON.parse(JSON.stringify(level)); // Deep clone
        this.gridSize = level.gridSize;
        this.tiles = this.level.tiles;
        this.rails = this.level.rails || []; // Rails for draggable tiles
        this.moveCount = 0;
        this.won = false;
        this.onUpdate = null; // Callback for UI updates

        this.initializeTiles();
        this.updatePowerFlow();
    }

    initializeTiles() {
        // Ensure all tiles have required properties
        this.tiles.forEach(tile => {
            if (tile.rotation === undefined) tile.rotation = 0;
            if (tile.locked === undefined) tile.locked = (tile.type === 'power' || tile.type === 'light');
            tile.powered = false;
        });
    }

    // Get connections for a tile based on type and rotation
    getTileConnections(type, rotation) {
        const baseConnections = {
            'empty': [],
            'power': ['right'],
            'light': ['left'],
            'straight': ['left', 'right'],
            'corner': ['top', 'right'],
            't-junction': ['left', 'top', 'right'],
            'cross': ['top', 'right', 'bottom', 'left'],
            'bridge': ['top', 'right', 'bottom', 'left'] // Connects all directions but only straight through
        };

        let connections = baseConnections[type] || [];

        // Rotate connections based on rotation angle
        const rotations = rotation / 90;
        for (let i = 0; i < rotations; i++) {
            connections = connections.map(dir => this.rotateDirection(dir));
        }

        return connections;
    }

    rotateDirection(direction) {
        const map = { 'top': 'right', 'right': 'bottom', 'bottom': 'left', 'left': 'top' };
        return map[direction];
    }

    // Get opposite direction
    getOppositeDirection(direction) {
        const map = { 'top': 'bottom', 'bottom': 'top', 'left': 'right', 'right': 'left' };
        return map[direction];
    }

    // Get tile at position
    getTileAt(x, y) {
        return this.tiles.find(t => t.x === x && t.y === y);
    }

    // Get neighbor tile in a direction
    getNeighbor(tile, direction) {
        const offsets = {
            'top': { x: 0, y: -1 },
            'bottom': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };

        const offset = offsets[direction];
        const nx = tile.x + offset.x;
        const ny = tile.y + offset.y;

        if (nx < 0 || nx >= this.gridSize.width || ny < 0 || ny >= this.gridSize.height) {
            return null;
        }

        return this.getTileAt(nx, ny);
    }

    // Check if two tiles are connected
    areConnected(tile1, tile2) {
        if (!tile1 || !tile2) return false;

        // Find direction from tile1 to tile2
        let direction = null;
        if (tile2.x === tile1.x + 1 && tile2.y === tile1.y) direction = 'right';
        else if (tile2.x === tile1.x - 1 && tile2.y === tile1.y) direction = 'left';
        else if (tile2.y === tile1.y + 1 && tile2.x === tile1.x) direction = 'bottom';
        else if (tile2.y === tile1.y - 1 && tile2.x === tile1.x) direction = 'top';
        else return false;

        const tile1Connections = this.getTileConnections(tile1.type, tile1.rotation);
        const tile2Connections = this.getTileConnections(tile2.type, tile2.rotation);

        return tile1Connections.includes(direction) &&
               tile2Connections.includes(this.getOppositeDirection(direction));
    }

    // Get all connected neighbors for a tile
    getConnectedNeighbors(tile) {
        const neighbors = [];
        const connections = this.getTileConnections(tile.type, tile.rotation);

        connections.forEach(direction => {
            const neighbor = this.getNeighbor(tile, direction);
            if (neighbor && this.areConnected(tile, neighbor)) {
                neighbors.push(neighbor);
            }
        });

        return neighbors;
    }

    // Update power flow from power source
    updatePowerFlow() {
        // Reset all powered states
        this.tiles.forEach(t => t.powered = false);

        // Find power source
        const powerSource = this.tiles.find(t => t.type === 'power');
        if (!powerSource) return;

        // BFS to propagate power
        const queue = [powerSource];
        const visited = new Set();
        visited.add(powerSource);
        powerSource.powered = true;

        while (queue.length > 0) {
            const current = queue.shift();
            const neighbors = this.getConnectedNeighbors(current);

            neighbors.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    neighbor.powered = true;
                    queue.push(neighbor);
                }
            });
        }

        // Check win condition
        this.checkWinCondition();
    }

    // Check if puzzle is solved
    checkWinCondition() {
        const lights = this.tiles.filter(t => t.type === 'light');
        this.won = lights.length > 0 && lights.every(light => light.powered);
        return this.won;
    }

    // Rotate a tile
    rotateTile(x, y) {
        const tile = this.getTileAt(x, y);
        if (!tile || tile.locked) return false;

        tile.rotation = (tile.rotation + 90) % 360;
        this.moveCount++;
        this.updatePowerFlow();

        if (this.onUpdate) {
            this.onUpdate();
        }

        return true;
    }

    // Reset level
    reset() {
        this.tiles.forEach(tile => {
            if (!tile.locked) {
                tile.rotation = Math.floor(Math.random() * 4) * 90;
            }
        });
        this.moveCount = 0;
        this.won = false;
        this.updatePowerFlow();

        if (this.onUpdate) {
            this.onUpdate();
        }
    }

    // Get game state
    getState() {
        return {
            tiles: this.tiles,
            rails: this.rails,
            moveCount: this.moveCount,
            won: this.won,
            gridSize: this.gridSize
        };
    }

    // Rail management methods

    // Get rail by ID
    getRail(railId) {
        return this.rails.find(r => r.id === railId);
    }

    // Get tiles on a specific rail
    getTilesOnRail(railId) {
        return this.tiles.filter(t => t.railId === railId);
    }

    // Check if a position on a rail is valid and empty
    canMoveTileToPosition(tile, newX, newY) {
        if (!tile.railId) return false;

        const rail = this.getRail(tile.railId);
        if (!rail) return false;

        // Check if position is within rail bounds
        if (rail.type === 'horizontal') {
            if (newY !== rail.y) return false;
            if (newX < rail.xMin || newX > rail.xMax) return false;
        } else if (rail.type === 'vertical') {
            if (newX !== rail.x) return false;
            if (newY < rail.yMin || newY > rail.yMax) return false;
        }

        // Check if position is within grid bounds
        if (newX < 0 || newX >= this.gridSize.width ||
            newY < 0 || newY >= this.gridSize.height) {
            return false;
        }

        // Check if position is occupied by another tile
        const occupant = this.getTileAt(newX, newY);
        return !occupant || occupant === tile;
    }

    // Move a tile along its rail
    moveTile(tile, newX, newY) {
        if (!this.canMoveTileToPosition(tile, newX, newY)) {
            return false;
        }

        tile.x = newX;
        tile.y = newY;
        this.updatePowerFlow();

        if (this.onUpdate) {
            this.onUpdate();
        }

        return true;
    }

    // Get the constrained position for dragging
    getConstrainedPosition(tile, targetX, targetY) {
        if (!tile.railId) return null;

        const rail = this.getRail(tile.railId);
        if (!rail) return null;

        let constrainedX = tile.x;
        let constrainedY = tile.y;

        if (rail.type === 'horizontal') {
            constrainedX = Math.max(rail.xMin, Math.min(rail.xMax, targetX));
            constrainedY = rail.y;
        } else if (rail.type === 'vertical') {
            constrainedX = rail.x;
            constrainedY = Math.max(rail.yMin, Math.min(rail.yMax, targetY));
        }

        return { x: constrainedX, y: constrainedY };
    }
}
