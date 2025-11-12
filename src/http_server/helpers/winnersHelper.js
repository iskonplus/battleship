import { users } from "../db.js";

export const getWinnersTable = () => {
  return users
    .map((user) => ({
      name: user.name,
      wins: user.wins || 0,
    }))
    .sort((a, b) => b.wins - a.wins);
};
