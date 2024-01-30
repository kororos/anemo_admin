import express from 'express';
import { startAnemoWebSocketServer, sendCommand as sendAnemoCommand } from "./anemoWebSocket.js";
import { startAdminWebSocketServer } from "./adminWebSocket.js";

startAnemoWebSocketServer();
startAdminWebSocketServer();

// 2. create the express app 
const app = express();

// Use express.json() middleware to parse JSON requests
app.use(express.json());


// 3. create a route to handle post messages at '/api/restart
app.post('/api/restart', (req, res, next) => {
    // Restart logic goes here
    const uuid = req.body.uuid;
    // If an error occurs, pass it to the next middleware
    try {
        // Restart logic
        const command = {
            command: "restart",
            uuid: uuid
        }
        sendAnemoCommand(command);
        res.send('Server restarted successfully');
    } catch (error) {
        next(error);
    }
});

// 4. create a middleware to handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the express server
const port = process.env.PORT || 3010;
app.listen(port, () => console.log(`Express Server running on port ${port}`));