import {
    sendJson,
    createUser,
    broadcastAll,
    getPublicRooms,
} from "../utils.js";
import { users } from "../db.js";
import { getWinnersTable } from "../helpers/winnersHelper.js";

export const handleReg = (ws, wss, msg) => {
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

    const winnersTable = getWinnersTable();

    const updateWinnersRes = {
        type: "update_winners",
        data: JSON.stringify(winnersTable),
        id: 0,
    };

    const okRes = {
        type: "reg",
        data: JSON.stringify(responseData),
        id: 0,
    };

    ws.user = activeUser;

    const publicRooms = getPublicRooms();
    const updateRoomRes = {
        type: "update_room",
        data: JSON.stringify(publicRooms),
        id: 0,
    };

    broadcastAll(wss, updateWinnersRes);
    sendJson(ws, updateRoomRes);
    sendJson(ws, okRes);
};
