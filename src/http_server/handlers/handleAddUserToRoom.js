import {
    stamp, sendJson, errRes, getRandomUUID, addUserToRoom, getPublicRooms, getPublicRoom, broadcastAll
} from "../utils.js";
import { rooms } from "../db.js";

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
        sendJson(player.ws, okRes);
    }

    const actualRoomsResponse = {
        type: "update_room",
        data: JSON.stringify(getPublicRooms()),
        id: 0,
    };

    broadcastAll(wss, actualRoomsResponse)
};
