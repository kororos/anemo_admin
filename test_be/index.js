import  { WebSocketServer } from 'ws';
import url from 'url';
import { v4 as uuidv4 } from 'uuid';
let count = 0;
const wss = new WebSocketServer({ port: 3000 });
const clients = new Map();

wss.on('connection', (ws, req) => {
    const parameters = new url.URL(req.url, `http://${req.headers.host}`).searchParams;
    const clientId = parameters.get('clientId');
    const uuid = uuidv4();
    clients.set(uuid, {clientId: clientId, ws: ws});
    console.log(`Client with ClientId: ${clientId} and uuid: ${uuid} CONNECTED`);
    ws.on('message', (message) => {
        console.log(`Received message: ${message.toString()} and uuid: ${uuid}`);
        // Handle the received message here

    });

    ws.on('close', () => {
        // Handle client disconnection here
        clients.delete(uuid);
        console.log(`Client with uuid: ${uuid} disconnected`);
    });

    // Send a welcome message to the client
    ws.send(`Welcome to the WebSocket server! ClientId: ${clientId} and uuid: ${uuid}`);
});


function sendMessage(){
    if(clients.size > 0) count++;
    clients.forEach( ({clientId, ws})=> {
        ws.send(`You are client ${clientId}, count= ${count}`);
    });
}

setInterval(() => sendMessage(), 1000);