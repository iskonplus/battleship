
import { coordKey, findHitShip, isShipKilled, getKilledShipBorderCells, areAllShipsKilled } from '../battlHelpers.js';
import { stamp, sendJson, errRes, getRoom } from "../utils.js";

export const handleAttack = (ws, msg) => {
    const { gameId, x, y, indexPlayer } = JSON.parse(msg.data.toString()) || {};

    if (!gameId || typeof x !== "number" || typeof y !== "number" || !indexPlayer) {
        errRes.data.errorText = "Invalid attack payload";
        console.log(`[${stamp()}] ->`, "Invalid attack payload", { gameId, x, y, indexPlayer });
        return sendJson(ws, errRes);
    }

    const room = getRoom(gameId);

    if (!room) {
        errRes.data.errorText = "Room not found for attack";
        console.log(`[${stamp()}] ->`, "Room not found for attack", { gameId });
        return sendJson(ws, errRes);
    }

    const shooter = room.roomUsers.find((user) => user.idPlayer === indexPlayer);

    if (!shooter) {
        errRes.data.errorText = "Shooter not found in this game";
        console.log(
            `[${stamp()}] ->`,
            "Shooter not found in this game",
            { gameId, indexPlayer }
        );
        return sendJson(ws, errRes);
    }

    const opponent = room.roomUsers.find((user) => user.idPlayer !== indexPlayer);

    if (!opponent) {
        errRes.data.errorText = "Opponent not found";
        console.log(
            `[${stamp()}] ->`,
            "Opponent not found for attack",
            { gameId, indexPlayer }
        );
        return sendJson(ws, errRes);
    }


    if (room.currentPlayerId && room.currentPlayerId !== indexPlayer) {
        errRes.data.errorText = "Not your turn";
        console.log(
            `[${stamp()}] ->`,
            "Attack rejected: not shooter turn",
            { expected: room.currentPlayerId, actual: indexPlayer }
        );
        return sendJson(ws, errRes);
    }

    if (!opponent.hits) {
        opponent.hits = new Set();
    }

    const shotKey = coordKey(x, y);

    console.log(
        `[${stamp()}] -> ATTACK request`,
        {
            gameId,
            shooter: { name: shooter.name, idPlayer: shooter.idPlayer },
            opponent: { name: opponent.name, idPlayer: opponent.idPlayer },
            position: { x, y },
        }
    );

    const hitInfo = findHitShip(opponent.ships, x, y);

    if (!hitInfo) {
        const attackRes = {
            type: "attack",
            data: JSON.stringify({
                position: { x, y },
                currentPlayer: indexPlayer,
                status: "miss",
            }),
            id: 0,
        };

        room.roomUsers.forEach((user) => sendJson(user.ws, attackRes));
        room.currentPlayerId = opponent.idPlayer;

        const turnRes = {
            type: "turn",
            data: JSON.stringify({
                currentPlayer: room.currentPlayerId,
            }),
            id: 0,
        };

        room.roomUsers.forEach((user) => sendJson(user.ws, turnRes));

        console.log(
            `[${stamp()}] -> ATTACK result miss, next player`,
            { nextPlayer: room.currentPlayerId }
        );

        return;
    }

    const { ship, cells: shipCells } = hitInfo;
    opponent.hits.add(shotKey);

    const killed = isShipKilled(shipCells, opponent.hits);

    const mainAttackRes = {
        type: "attack",
        data: JSON.stringify({
            position: { x, y },
            currentPlayer: indexPlayer,
            status: killed ? "killed" : "shot",
        }),
        id: 0,
    };

    room.roomUsers.forEach((user) => sendJson(user.ws, mainAttackRes));

    if (killed) {
        const borderCells = getKilledShipBorderCells(shipCells);

        for (const cell of borderCells) {
            const borderAttackRes = {
                type: "attack",
                data: JSON.stringify({
                    position: { x: cell.x, y: cell.y },
                    currentPlayer: indexPlayer,
                    status: "miss",
                }),
                id: 0,
            };

            room.roomUsers.forEach((user) => sendJson(user.ws, borderAttackRes));
        }
    }
    
    const allKilled = areAllShipsKilled(opponent.ships, opponent.hits);

    if (allKilled) {
        const finishRes = {
            type: "finish",
            data: JSON.stringify({
                winPlayer: indexPlayer,
            }),
            id: 0,
        };

        room.roomUsers.forEach((user) => sendJson(user.ws, finishRes));

        console.log(
            `[${stamp()}] -> FINISH game`,
            { gameId, winPlayer: indexPlayer }
        );

        return;
    }

    room.currentPlayerId = indexPlayer;

    const turnRes = {
        type: "turn",
        data: JSON.stringify({
            currentPlayer: room.currentPlayerId,
        }),
        id: 0,
    };

    room.roomUsers.forEach((user) => sendJson(user.ws, turnRes));

    console.log(
        `[${stamp()}] -> ATTACK result`,
        { status: killed ? "killed" : "shot", nextPlayer: room.currentPlayerId }
    );
};
