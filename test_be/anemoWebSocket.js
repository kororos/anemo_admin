import { WebSocketServer } from "ws";
import url from "url";
import { v4 as uuidv4 } from "uuid";
import db from "./db/models/index.js";

import { sendAdminCommandToAll } from "./adminWebSocket.js";

const clients = new Map();

function startAnemoWebSocketServer(server) {
  let count = 0;
  const wss = new WebSocketServer({ noServer: true, path: "/ws/anemometer" });
  console.log("WebSocket server for anemometers is running on port 3000");
  wss.on("connection", async (ws, req) => {
    const parameters = new url.URL(req.url, `http://${req.headers.host}`)
      .searchParams;
    const clientId = parameters.get("clientId");
    const hwVersion = parameters.get("hwVersion");
    const swVersion = parameters.get("swVersion");
    const mac = parameters.get("mac");
    const uuid = uuidv4();
    if (clients.has(mac) &&
      clients.get(mac).ws) {
      clients.get(mac).ws.close();
      console.log(`Client with mac: ${mac} was already connected with UUID: ${clients.get(mac).uuid} and was disconnected`);
    }
    clients.set(mac, { clientId: clientId, hwVersion: hwVersion, swVersion: swVersion, mac: mac, uuid: uuid, ws: ws });
    console.log(
      `Client with ClientId: ${clientId}, hwVersion: ${hwVersion} and uuid: ${uuid} CONNECTED`
    );

    await db.Device.upsert({
      name: clientId,
      hwVersion: hwVersion,
      fwVersion: swVersion,
      macAddress: mac,
      lastConnection: new Date()
    });

    sendAdminCommandToAll({
      command: "getClientsMap",
      clientsArray: getClientsArray()
    });

    ws.on("message", (message) => {
      const messageString = message.toString();
      const messageObj = JSON.parse(messageString);
      console.log(`Received message: ${message.toString()} and uuid: ${uuid}`);
      if (messageObj.type === "measurements") {
        sendAdminCommandToAll({
          command: "measurements",
          mac: messageObj.mac,
          clientId: messageObj.clientId,
          data: messageObj.data
        });
      } else {
        console.info(`Received message of unknown type: ${message.toString()} and uuid: ${uuid}`);
      }
      // Handle the received message here
    });
    
    ws.on("ping", () => {
      console.log(`[${new Date().toISOString()}]: Ping received from client with uuid: ${uuid}`);
      //ws.pong();
    });

    ws.on("close", () => {
      // Handle client disconnection here
      clients.delete(mac);
      console.log(`Client with uuid: ${uuid} and mac: ${mac} disconnected`);
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

  //setInterval(() => sendMessage(), 1000);
  return wss;
}
function sendCommand(command) {
  console.log(JSON.stringify(command));
  const client = clients.get(command.mac);
  console.log(`Client is: ${command.uuid}`);
  client.ws.send(command.command);
}

function getClientsMap() {
  console.log("Clients are: ", clients.keys());
  return clients;
}

function getClientsArray() {
  const readyStateMap = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
  const clientsArray = new Array();
  clients.forEach((client, key) => {
    clientsArray.push({
      clientId: client.clientId,
      uuid: client.uuid,
      status: client.ws.readyState,
      statusText: readyStateMap[client.ws.readyState],
      hwVersion: client.hwVersion,
      swVersion: client.swVersion,
      mac: key
    })
  });
  return clientsArray;
}

export { startAnemoWebSocketServer, sendCommand, getClientsMap, getClientsArray }; 