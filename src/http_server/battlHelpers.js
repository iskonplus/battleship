
const BOARD_SIZE = 10;
export const coordKey = (x, y) => `${x}:${y}`;

export const  getShipCells = (ship) => {
    const cells = [];
    const { position, direction, length } = ship;
    const startX = position.x;
    const startY = position.y;

    for (let i = 0; i < length; i++) {
        const x = direction ? startX : startX + i;
        const y = direction ? startY + i : startY;
        cells.push({ x, y });
    }

    return cells;
};

export const findHitShip = (ships, x, y) => {
    if (!Array.isArray(ships)) return null;

    for (const ship of ships) {
        const cells = getShipCells(ship);
        if (cells.some((cell) => cell.x === x && cell.y === y)) {
            return { ship, cells };
        }
    }

    return null;
};

export const isShipKilled = (shipCells, hitsSet) => {
    return shipCells.every((cell) => hitsSet.has(coordKey(cell.x, cell.y)));
};

export const areAllShipsKilled = (ships, hitsSet) => {
    if (!Array.isArray(ships)) return false;
    return ships.every((ship) => {
        const cells = getShipCells(ship);
        return isShipKilled(cells, hitsSet);
    });
};

export const getKilledShipBorderCells = (shipCells) => {
    const border = new Set();

    for (const cell of shipCells) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = cell.x + dx;
                const ny = cell.y + dy;

                if (dx === 0 && dy === 0) continue;
                if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;

                border.add(coordKey(nx, ny));
            }
        }
    }

    const shipCellKeys = new Set(shipCells.map((c) => coordKey(c.x, c.y)));
    shipCellKeys.forEach((key) => border.delete(key));

    return Array.from(border).map((key) => {
        const [x, y] = key.split(":").map((n) => Number(n));
        return { x, y };
    });
};

export const sendJsonPlayers = (room, data) => {
    room.roomUsers.forEach((user) => sendJson(user.ws, sendJson));
}
