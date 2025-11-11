import {
    stamp, sendJson, errRes, getRoom
} from "../utils.js";

export const handleAddShips = (ws, msg) => {
    const { gameId, ships, indexPlayer } = JSON.parse(msg.data.toString()) || {};

    if (!gameId || !Array.isArray(ships) || !indexPlayer) {
        errRes.data.errorText = "Invalid add_ships payload";
        console.log(`[${stamp()}] ->`, "Invalid add_ships payload");
        return sendJson(ws, errRes);
    }

    const room = getRoom(gameId);

    if (!room) {
        errRes.data.errorText = "Room not found";
        console.log(`[${stamp()}] ->`, "Room not found");
        return sendJson(ws, errRes);
    }

    const player = room.roomUsers.find((user) => user.idPlayer === indexPlayer);

    if (!player) {
        errRes.data.errorText = "Player not in this game";
        console.log(`[${stamp()}] ->`, "Player not in this game");
        return sendJson(ws, errRes);
    }

    if (player.ready) {
        console.log(`[${stamp()}] -> ships already set for ${player.name}`);
        return;
    }

    if (!room.firstPlayerId) room.firstPlayerId = indexPlayer;

    player.ships = ships;
    player.ready = true;

    console.log(
        `[${stamp()}] -> ${player.name} submitted ships for game ${gameId}`
    );

    const bothReady = room.roomUsers.every((user) => user.ready);

    if (!bothReady) return;
    room.currentPlayerId = room.firstPlayerId;

    for (const user of room.roomUsers) {
        const startRes = {
            type: "start_game",
            data: JSON.stringify({
                ships: user.ships,
                currentPlayerIndex: room.currentPlayerId,
            }),
            id: 0,
        };

        console.log(`[${stamp()}] -> start_game to ${user.name}`, startRes);
        sendJson(user.ws, startRes);
    }

    const turnRes = {
        type: "turn",
        data: JSON.stringify({ currentPlayer: room.currentPlayerId }),
        id: 0,
    };

    room.roomUsers.forEach((user) => sendJson(user.ws, turnRes));
    console.log(`[${stamp()}] -> turn broadcast`, turnRes);
};