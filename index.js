import { httpServer } from "./src/http_server/index.js";

const HTTP_PORT = 8181;


// console.log(`Start static http server on the http://localhost:${HTTP_PORT} port!`);
// httpServer.listen(HTTP_PORT);


httpServer.listen(HTTP_PORT, () => {
  console.log('HTTP + WS listening on:');
  console.log(`  http://localhost:${HTTP_PORT}`);
  console.log(`  ws://localhost:${HTTP_PORT}`);
});