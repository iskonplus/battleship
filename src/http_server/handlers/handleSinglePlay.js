import { sendJson, getRandomUUID } from "../utils.js";

export const handleSinglePlay = (ws) => {
    const idGame = getRandomUUID();
    const idPlayer = getRandomUUID();
    const idBot = getRandomUUID();

    const okRes = {
        type: "create_game",
        data: JSON.stringify({ idGame, idPlayer }),
        id: 0,
    };

    sendJson(ws, okRes);
};
