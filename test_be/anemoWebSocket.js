import {WebSocketServer} from "ws";
import url from "url";
import { v4 as uuidv4 } from "uuid";

import { sendAdminCommandToAll } from "./adminWebSocket.js";

const clients = new Map();

function startAnemoWebSocketServer(server) {
  let count = 0;
  //const wss = new WebSocket.Server({ port: 3000, path: "/ws/anemometer" });
  const wss = new WebSocketServer({ noServer: true, path: "/ws/anemometer"});
  console.log("WebSocket server for anemometers is running on port 3000");
  wss.on("connection", (ws, req) => {
    const parameters = new url.URL(req.url, `http://${req.headers.host}`)
      .searchParams;
    const clientId = parameters.get("clientId");
    const hwVersion = parameters.get("hwVersion");
    const swVersion = parameters.get("swVersion");
    const uuid = uuidv4();
    clients.set(uuid, { clientId: clientId, hwVersion: hwVersion, swVersion:swVersion, ws: ws });
    console.log(
      `Client with ClientId: ${clientId}, hwVersion: ${hwVersion} and uuid: ${uuid} CONNECTED`
    );
    
    sendAdminCommandToAll({
      command: "getClientsMap",
      clientsArray: getClientsArray()
    });

    ws.on("message", (message) => {
      console.log(`Received message: ${message.toString()} and uuid: ${uuid}`);
      // Handle the received message here
    });

    ws.on("close", () => {
      // Handle client disconnection here
      clients.delete(uuid);
      console.log(`Client with uuid: ${uuid} disconnected`);
      sendAdminCommandToAll({
        command: "getClientsMap",
        //clientsMap: Object.fromEntries(clients.entries())
        clientsArray: getClientsArray()
      });
    });

    // Send a welcome message to the client
    ws.send(
      `Welcome to the WebSocket server! ClientId: ${clientId} and uuid: ${uuid}`
    );
  });

  function sendMessage() {
    if (clients.size > 0) count++;
    clients.forEach(({ clientId, ws }) => {
      ws.send(`You are client ${clientId}, count= ${count}`);
    });
  }

  setInterval(() => sendMessage(), 1000);
  return wss;
}
function sendCommand(command){
  console.log(JSON.stringify(command));
  const client = clients.get(command.uuid);
  console.log(`Client is: ${command.uuid}`);
  client.ws.send(command.command);
}

function getClientsMap(){
  console.log("Clients are: ", clients.keys());
  return clients;
}

function getClientsArray(){
  const readyStateMap = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
  const clientsArray = new Array();
  clients.forEach((client, key) => {
    clientsArray.push({
      clientId: client.clientId,
      uuid: key,
      status: client.ws.readyState,
      statusText: readyStateMap[client.ws.readyState],
      hwVersion: client.hwVersion,
      swVersion: client.swVersion
    })
  });
  return clientsArray;
}

export { startAnemoWebSocketServer, sendCommand, getClientsMap, getClientsArray }; 