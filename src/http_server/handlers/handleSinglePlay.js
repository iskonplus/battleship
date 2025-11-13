import { sendJson, getRandomUUID, errRes, createRoom } from "../utils.js";
import { userBot } from '../db.js';
import { getBotShips } from '../helpers/botHelper.js';

export const handleSinglePlay = (ws) => {

    const user = ws.user;

    if (!user) {
        errRes.data.errorText = "Not authorized";
        console.log(`[${stamp()}] ->`, "User is not authorized");
        return sendJson(ws, errRes);
    }

    const room = createRoom(user, ws);

    const idGame = getRandomUUID();
    const humanId = getRandomUUID();
    const botId = getRandomUUID();

    room.idGame = idGame;
    room.isSinglePlay = true;
    room.firstPlayerId = humanId;
    room.currentPlayerId = humanId;

    const human = room.roomUsers[0];
    human.idPlayer = humanId;
    human.ready = false;
    human.ships = [];
    human.hits = new Set();
    human.isBot = false;


    room.roomUsers.push({
        name: userBot.name,
        index: userBot.index,
        ws: null,
        idPlayer: botId,
        ready: true,
        ships: getBotShips(),
        hits: new Set(),
        isBot: true,
    });


  const createGameRes = {
    type: 'create_game',
    data: JSON.stringify({
      idGame,
      idPlayer: humanId,
    }),
    id: 0,
  };

  sendJson(ws, createGameRes);
};
