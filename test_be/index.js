import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './router/router.js';
import firmwareUploadRoutes from './router/firmwareUploadRouter.js';
import firmwareInfoRoutes from './router/firmwareInfo.js';
import measurementRoutes from './router/measurementRouter.js';
import authRoutes from './router/auth.js';
import unprotected from './router/unprotected.js';
import { startAnemoWebSocketServer, sendCommand as sendAnemoCommand } from "./anemoWebSocket.js";
import { startAdminWebSocketServer } from "./adminWebSocket.js";
import {createServer} from 'http';



// 2. create the express app 
const app = express();

// Use express.json() middleware to parse JSON requests
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:9000', 'http://kororos.eu', 'http://anemo.kororos.eu:9000', 'https://anemo.kororos.eu'],
    credentials: true,
    exposedHeaders: ['Authorization'],

}));
app.options('*', cors());

app.use(cookieParser());

// Authentication flow: 
// 1. First apply all unprotected routes (no authentication check)
app.use(unprotected);

// 2. Apply all protected routes
// Authentication is now handled by the checkRole middleware:
// - Routes with 'guest' role will be accessible without authentication
// - Other routes will require proper authentication and role permissions
app.use(routes, firmwareUploadRoutes, firmwareInfoRoutes, measurementRoutes, authRoutes);




// 4. create a middleware to handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const server = createServer(app);
const wssAnemo = startAnemoWebSocketServer(server);
const wssAdmin = startAdminWebSocketServer(server);

server.on('upgrade', (request, socket, head) => {
    console.log('upgrade request:', request.url, request.headers.host, request.headers.upgrade, request.headers.connection, request.headers['sec-websocket-key'], request.headers['sec-websocket-protocol'], request.headers['sec-websocket-version']);
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    //console.log('upgrade request:', request.url, request.headers.host, pathname);
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