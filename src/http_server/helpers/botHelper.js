const BOT_SHIPS = [
  { position: { x: 0, y: 0 }, direction: false, length: 4, type: 'huge' },
  { position: { x: 2, y: 2 }, direction: true,  length: 3, type: 'large' },
  { position: { x: 5, y: 1 }, direction: false, length: 3, type: 'large' },
  { position: { x: 7, y: 4 }, direction: true,  length: 2, type: 'medium' },
  { position: { x: 1, y: 6 }, direction: false, length: 2, type: 'medium' },
  { position: { x: 4, y: 8 }, direction: false, length: 2, type: 'medium' },
  { position: { x: 9, y: 0 }, direction: false, length: 1, type: 'small' },
  { position: { x: 9, y: 2 }, direction: false, length: 1, type: 'small' },
  { position: { x: 9, y: 4 }, direction: false, length: 1, type: 'small' },
  { position: { x: 9, y: 6 }, direction: false, length: 1, type: 'small' },
];

export const getBotShips = () => BOT_SHIPS;