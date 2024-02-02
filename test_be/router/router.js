import  express from 'express';
import { sendCommand as sendAnemoCommand } from "../anemoWebSocket.js";
const routes = express.Router();

routes.post('/api/restart', (req, res, next) => {
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


export default routes;