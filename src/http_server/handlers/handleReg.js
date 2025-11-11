import { stamp, sendJson, createUser } from "../utils.js";
import { users } from "../db.js";

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
