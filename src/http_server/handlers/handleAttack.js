import {
    BOARD_SIZE,
    coordKey,
    findHitShip,
    isShipKilled,
    getKilledShipBorderCells,
    areAllShipsKilled,
    sendJsonPlayers,
} from "../battlHelpers.js";
import { stamp, sendJson, errRes, getRoom, broadcastAll} from "../utils.js";
import { removeRoom } from '../helpers/roomHelper.js';
import { getWinnersTable } from "../helpers/winnersHelper.js";

export const handleAttack = (ws, wss, msg) => {
    const { gameId, x, y, indexPlayer } = JSON.parse(msg.data.toString()) || {};

    if (
        !gameId ||
        typeof x !== "number" ||
        typeof y !== "number" ||
        !indexPlayer
    ) {
        errRes.data.errorText = "Invalid attack payload";
        console.log(`[${stamp()}] ->`, "Invalid attack payload", {
            gameId,
            x,
            y,
            indexPlayer,
        });
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
        console.log(`[${stamp()}] ->`, "Shooter not found in this game", {
            gameId,
            indexPlayer,
        });
        return sendJson(ws, errRes);
    }

    const opponent = room.roomUsers.find((user) => user.idPlayer !== indexPlayer);

    if (!opponent) {
        errRes.data.errorText = "Opponent not found";
        console.log(`[${stamp()}] ->`, "Opponent not found for attack", {
            gameId,
            indexPlayer,
        });
        return sendJson(ws, errRes);
    }

    if (room.currentPlayerId && room.currentPlayerId !== indexPlayer) {
        errRes.data.errorText = "Not your turn";
        console.log(`[${stamp()}] ->`, "Attack rejected: not shooter turn", {
            expected: room.currentPlayerId,
            actual: indexPlayer,
        });
        return sendJson(ws, errRes);
    }

    if (!opponent.hits) {
        opponent.hits = new Set();
    }

    const shotKey = coordKey(x, y);

    // console.log(`[${stamp()}] -> ATTACK request`, {
    //     gameId,
    //     shooter: { name: shooter.name, idPlayer: shooter.idPlayer },
    //     opponent: { name: opponent.name, idPlayer: opponent.idPlayer },
    //     position: { x, y },
    // });

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

        sendJsonPlayers(room, attackRes);
        room.currentPlayerId = opponent.idPlayer;

        const turnRes = {
            type: "turn",
            data: JSON.stringify({
                currentPlayer: room.currentPlayerId,
            }),
            id: 0,
        };

        sendJsonPlayers(room, turnRes);

        // console.log(`[${stamp()}] -> ATTACK result miss, next player`, {
        //     nextPlayer: room.currentPlayerId,
        // });

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

    sendJsonPlayers(room, mainAttackRes);

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

            sendJsonPlayers(room, borderAttackRes);
        }
    }

    const allKilled = areAllShipsKilled(opponent.ships, opponent.hits);

    if (allKilled) {
        const winnerGlobal = ws.user;

        if (winnerGlobal) {
            winnerGlobal.wins = (winnerGlobal.wins || 0) + 1;
            // console.log(`[${stamp()}] -> WINNER updated`, {
            //     name: winnerGlobal.name,
            //     wins: winnerGlobal.wins,
            // });
        } else {
            // console.log(`[${stamp()}] -> WINNER not found on ws.user`, {
            //     gameId,
            //     indexPlayer,
            // });
        }

        const winnersTable = getWinnersTable();

        const finishRes = {
            type: "finish",
            data: JSON.stringify({
                winPlayer: indexPlayer,
            }),
            id: 0,
        };

        sendJsonPlayers(room, finishRes);

        // console.log(`[${stamp()}] -> FINISH game`, {
        //     gameId,
        //     winPlayer: indexPlayer,
        // });

        const updateWinnersRes = {
            type: "update_winners",
            data: JSON.stringify(winnersTable),
            id: 0,
        };

        broadcastAll(wss, updateWinnersRes);
        removeRoom(gameId);

        // console.log(`[${stamp()}] -> update_winners`, winnersTable);

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

    sendJsonPlayers(room, turnRes);

    // console.log(`[${stamp()}] -> ATTACK result`, {
    //     status: killed ? "killed" : "shot",
    //     nextPlayer: room.currentPlayerId,
    // });
};

export const handlerRandomAttack = (ws, wss, msg) => {
    const { gameId, indexPlayer } = JSON.parse(msg.data.toString()) || {};

    if (!gameId || !indexPlayer) {
        errRes.data.errorText = "Invalid randomAttack payload";
        console.log(`[${stamp()}] ->`, "Invalid randomAttack payload", {
            gameId,
            indexPlayer,
        });
        return sendJson(ws, errRes);
    }

    const room = getRoom(gameId);

    if (!room) {
        errRes.data.errorText = "Room not found for randomAttack";
        console.log(`[${stamp()}] ->`, "Room not found for randomAttack", {
            gameId,
        });
        return sendJson(ws, errRes);
    }

    const x = Math.floor(Math.random() * BOARD_SIZE);
    const y = Math.floor(Math.random() * BOARD_SIZE);

    // console.log(`[${stamp()}] -> RANDOM ATTACK request`, {
    //     gameId,
    //     indexPlayer,
    //     x,
    //     y,
    // });

    const attackMsg = {
        type: "randomAttack",
        data: JSON.stringify({
            gameId,
            x,
            y,
            indexPlayer,
        }),
        id: 0,
    };

    return handleAttack(ws, wss, attackMsg);
};
