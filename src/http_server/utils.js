import crypto from 'crypto';
import { users, rooms } from './db.js';

export const getRandomUUID = _ => crypto.randomUUID();

export const createUser = (user) => {
    const newUser = { ...user, index: crypto.randomUUID(), wins: 0,  };
    users.push(newUser);
    return newUser;
}

export const stamp = () => new Date().toISOString();

// export const sendJson = (ws, payload) => {
//     if (ws.readyState === ws.OPEN) {
//         ws.send(JSON.stringify(payload));
//     }
// };
export const sendJson = (ws, payload) => {
  try {
    // payload ожидается вида { type, data, id }
    const { type, id } = payload || {};
    // data может быть строкой; для лога покажем коротко
    console.log(`[${stamp()}] -> ${type ?? 'UNKNOWN'} (id:${id ?? 0})`, payload);

    ws.send(JSON.stringify(payload));
  } catch (e) {
    console.log(`[${stamp()}] -> sendJson error`, e);
  }
};

export const broadcastAll = (wss, payload) => {
    wss.clients.forEach((client) => {
        sendJson(client, payload);
    })
};

export function createRoom(user, ws) {
    const room = {
        roomId: crypto.randomUUID(),
        roomUsers: [{ name: user.name, index: user.index, ws }]
    };
    rooms.push(room);
    return room;
}

export function addUserToRoom(user, id, ws, gameId) {
    rooms.forEach(room => {
        if (room.roomId === id) {
            room.roomUsers.push({ name: user.name, index: user.index, ws });
        }
    })
    rooms.forEach((room, index) => {
        if (room.roomUsers.length === 1 && room.roomUsers[0].index === user.index) {
            rooms.splice(index, 1);
        }
    })
}

export function getPublicRooms() {
        return rooms
        .filter(room => room.roomUsers.length === 1)
        .map(room => ({
            roomId: room.roomId,
            roomUsers: room.roomUsers.map(user => ({ name: user.name, index: user.index })),
        }));
}
export function getPublicRoom(room) {
       return{
            roomId: room.roomId,
            roomUsers: room.roomUsers.map(user => ({ name: user.name, index: user.index })),
        };
}

export const getRoom = (gameId) => rooms.find((room) => room.idGame === gameId);

export const errRes = {
    type: "error",
    data: { error: true, errorText: "" },
    id: 0,
};




