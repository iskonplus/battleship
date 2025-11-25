import { httpServer } from "./src/http_server/index.js";

const HTTP_PORT = 8181;

httpServer.listen(HTTP_PORT, () => {
  console.log('HTTP + WS listening on:');
  console.log(`  http://localhost:${HTTP_PORT}`);
  console.log(`  ws://localhost:${HTTP_PORT}`);
});