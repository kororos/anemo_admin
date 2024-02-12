import {WebSocketServer}  from "ws";
import { sendCommand, getClientsArray } from "./anemoWebSocket.js";
import url from "url";
import { v4 as uuidv4 } from "uuid";

const clients = new Map();

function startAdminWebSocketServer(server) {
  let count = 0;
  //const wss = new WebSocket.Server({ port: 3001, path: "/ws/admin" });
  const wss = new WebSocketServer({ noServer: true, path: "/ws/admin"});
  console.log(`[${new Date().toISOString()}]: WebSocket server for admin is running on port 3000`);
  wss.on("connection", (ws, req) => {
    const parameters = new url.URL(req.url, `http://${req.headers.host}`)
      .searchParams;
    const clientId = parameters.get("clientId");
    const uuid = uuidv4();
    clients.set(uuid, { clientId: clientId, ws: ws });
    console.log(
      `[${new Date().toISOString()}]: Client with ClientId: ${clientId} and uuid: ${uuid} CONNECTED`
    );
    ws.on("message", (message) => {
      console.log(`[${new Date().toISOString()}]: Received message: ${message.toString()} and uuid: ${uuid}`);
      if(message !== 'ping'){
        const command = JSON.parse(message);
        sendCommand(command);
      }else{
        console.log(`[${new Date().toISOString()}]: Received ping`);
        ws.send('pong');
        console.log(`[${new Date().toISOString()}]: Sent pong`);
      }
    });

    ws.on("close", () => {
      // Handle client disconnection here
      clients.delete(uuid);
      console.log(`[${new Date().toISOString()}]: Client with uuid: ${uuid} disconnected`);
    });

    // Send a welcome message to the client
    ws.send(
      `Welcome to the WebSocket server! ClientId: ${clientId} and uuid: ${uuid}`
    );
    sendAdminCommandToAll({
      command: "getClientsMap",
      //clientsMap: Object.fromEntries(clients.entries())
      clientsArray: getClientsArray()
    });
  });
  return wss;
}

function sendAdminCommand(uuid, command) {
  clients.get(uuid).ws.send(JSON.stringify(command));
}

function sendAdminCommandToAll(command){
  clients.forEach(({ ws }) => {
    ws.send(JSON.stringify(command));
  });
}

export { startAdminWebSocketServer, sendAdminCommand, sendAdminCommandToAll };
