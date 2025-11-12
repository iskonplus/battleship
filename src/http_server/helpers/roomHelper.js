import { rooms } from "../db.js";
import { stamp } from "../utils.js";

export const removeRoom = (gameId) => {
    const index = rooms.findIndex((room) => room.idGame === gameId);

    if (index !== -1) {
        const [removed] = rooms.splice(index, 1);
        console.log(`[${stamp()}] -> ROOM removed after finish`, {
            gameId,
            roomId: removed.roomId,
        });
    }
};
