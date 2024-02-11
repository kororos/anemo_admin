import express from 'express';
import cors from 'cors';
import routes from './router/router.js';
import firmwareUploadRoutes from './router/firmwareUploadRouter.js';
import firmwareInfoRoutes from './router/firmwareInfo.js';
import { startAnemoWebSocketServer, sendCommand as sendAnemoCommand } from "./anemoWebSocket.js";
import { startAdminWebSocketServer } from "./adminWebSocket.js";
import {createServer} from 'http';



// 2. create the express app 
const app = express();

// Use express.json() middleware to parse JSON requests
app.use(express.json());
app.use(cors());
app.use(routes, firmwareUploadRoutes, firmwareInfoRoutes);




// 4. create a middleware to handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const server = createServer(app);
const wssAnemo = startAnemoWebSocketServer(server);
const wssAdmin = startAdminWebSocketServer(server);

server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `ws://${request.headers.host}`).pathname;
    if (pathname === '/ws/anemometer') {
        wssAnemo.handleUpgrade(request, socket, head, (ws) => {
            wssAnemo.emit('connection', ws, request);
        });
    } else if (pathname === '/ws/admin') {
        wssAdmin.handleUpgrade(request, socket, head, (ws) => {
            wssAdmin.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

// Start the express server
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Express Server running on port ${port}`));