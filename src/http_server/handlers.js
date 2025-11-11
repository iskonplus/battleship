import {
    stamp,
    sendJson,
    createUser,
    createRoom,
    getRandomUUID,
    addUserToRoom,
    getPublicRooms,
    getPublicRoom,
    getRoom
} from "./utils.js";
import { users, rooms } from "./db.js";

const errRes = {
    type: "error",
    data: { error: true, errorText: "" },
    id: 0,
};

export const handleReg = (ws, msg) => {
    const { name, password } = JSON.parse(msg.data.toString()) || {};

    let activeUser = users.find(
        (user) => user.name === name && user.password === password
    );

    if (!activeUser) activeUser = createUser({ name, password });

    let responseData = {
        name: activeUser.name,
        index: activeUser.index,
        error: false,
        errorText: "",
    };

    const okRes = {
        type: "reg",
        data: JSON.stringify(responseData),
        id: 0,
    };

    ws.user = activeUser;

    console.log(`[${stamp()}] ->`, okRes);
    sendJson(ws, okRes);
};

export const handleCreateRoom = (ws, wss) => {
    const user = ws.user;

    if (!user) {
        errRes.data.errorText = "Not authorized (reg required)";
        console.log(`[${stamp()}] ->`, "User is not authorized");
        return sendJson(ws, errRes);
    }

    const roomAlreadyCreated = rooms.some(
        (room) =>
            room.roomUsers.length === 1 && room.roomUsers[0].index === user.index
    );

    if (roomAlreadyCreated) {
        errRes.data.errorText = "User already created room";
        console.log(`[${stamp()}] ->`, "User already created room");
        return sendJson(ws, errRes);
    }

    const room = createRoom(user, ws);
    console.log(`[${stamp()}] -> Created room ${room.roomId} by ${user.name}`);

    const okRes = {
        type: "update_room",
        data: JSON.stringify(getPublicRooms()),
        id: 0,
    };

    console.log(`[${stamp()}] ->`, okRes);

    wss.clients?.forEach((client) => sendJson(client, okRes));
};

export const handleAddUserToRoom = (wss, ws, msg) => {
    const { indexRoom } = JSON.parse(msg.data.toString()) || {};
    const room = rooms.find((room) => room.roomId === indexRoom);
    const user = ws.user;

    if (!room) {
        errRes.data.errorText = "Room not found";
        console.log(`[${stamp()}] => `, errRes);
        return sendJson(ws, errRes);
    }

    if (room.roomUsers.length >= 2) {
        errRes.data.errorText = "Room is full";
        return sendJson(ws, errRes);
    }

    let userInRoom = room.roomUsers.find((u) => u.index === user.index);

    if (userInRoom) {
        errRes.data.errorText = "User already in room";
        console.log(`[${stamp()}] ->  User already in room`, getPublicRoom(room));
        return sendJson(ws, errRes);
    }

    addUserToRoom(user, indexRoom, ws);

    const responseUpdateRoom = {
        type: "update_room",
        data: JSON.stringify(getPublicRoom(room)),
        id: 0,
    };

    console.log(`[${stamp()}] ->  User added to room`, responseUpdateRoom);
    sendJson(ws, responseUpdateRoom);

    room.idGame = getRandomUUID();
    room.roomUsers.forEach((user) => (user.idPlayer = getRandomUUID()));

    const okRes = {
        type: "create_game",
        data: "",
        id: 0,
    };

    for (const player of room.roomUsers) {
        okRes.data = JSON.stringify({
            idGame: room.idGame,
            idPlayer: player.idPlayer,
        });
        console.log(`[${stamp()}] -> ${player.name} in game`, okRes);
        sendJson(player.ws, okRes);
    }

    const actualRoomsResponse = {
        type: "update_room",
        data: JSON.stringify(getPublicRooms()),
        id: 0,
    };

    wss?.clients?.forEach((client) => {
        sendJson(client, actualRoomsResponse);
    });
};

export const handleAddShips = (ws, msg) => {
    const { gameId, ships, indexPlayer } = JSON.parse(msg.data.toString()) || {};

    if (!gameId || !Array.isArray(ships) || !indexPlayer) {
        errRes.data.errorText = "Invalid add_ships payload";
        console.log(`[${stamp()}] ->`, "Invalid add_ships payload");
        return sendJson(ws, errRes);
    }

    const room = rooms.find((room) => room.idGame === gameId);

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

    for (const user of room.roomUsers) {
        const startRes = {
            type: "start_game",
            data: JSON.stringify({
                ships: user.ships,
                currentPlayerIndex: user.idPlayer,
            }),
            id: 0,
        };

        console.log(`[${stamp()}] -> start_game to ${user.name}`, startRes);
        sendJson(user.ws, startRes);
    }

    const turnRes = {
        type: "turn",
        data: JSON.stringify({ currentPlayer: room.firstPlayerId }),
        id: 0,
    };

    room.roomUsers.forEach((user) => sendJson(user.ws, turnRes));
    console.log(`[${stamp()}] -> turn broadcast`, turnRes);
};

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

    if (room.currentPlayerId && room.currentPlayerId !== indexPlayer) {
        errRes.data.errorText = "Not your turn";
        console.log(
            `[${stamp()}] ->`,
            "Attack rejected: not shooter turn",
            { expected: room.currentPlayerId, actual: indexPlayer }
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

    console.log(
        `[${stamp()}] -> ATTACK request`,
        {
            gameId,
            shooter: { name: shooter.name, idPlayer: shooter.idPlayer },
            opponent: { name: opponent.name, idPlayer: opponent.idPlayer },
            position: { x, y },
        }
    );

};

export const handleSinglePlay = (ws) => {
    const idGame = getRandomUUID();
    const idPlayer = getRandomUUID();
    const idBot = getRandomUUID();

    const okRes = {
        type: "create_game",
        data: JSON.stringify({ idGame, idPlayer }),
        id: 0,
    };

    console.log(`[${stamp()}] ->`, okRes);
    sendJson(ws, okRes);
};
