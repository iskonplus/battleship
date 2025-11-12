import { stamp, sendJson, errRes, createRoom, getPublicRooms, broadcastAll } from "../utils.js";
import { rooms } from "../db.js";
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

    broadcastAll(wss, okRes);

    // wss.clients?.forEach((client) => sendJson(client, okRes));
};
