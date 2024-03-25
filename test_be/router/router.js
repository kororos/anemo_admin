import  express from 'express';
import { sendCommand as sendAnemoCommand, getClientsMap} from "../anemoWebSocket.js";
import { sendAdminCommand } from "../adminWebSocket.js";
import { checkRole } from '../middleware/auth.js';

const routes = express.Router();
routes.post('/api/restart', await checkRole(['admin']), (req, res, next) => {
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

routes.post('/api/getClients', await checkRole(['admin']), (req, res, next) => {
    const uuid = req.body.uuid;
    // If an error occurs, pass it to the next middleware
    try {
        const clientsMap = getClientsMap();
        const clientMapObject = Object.fromEntries(clientsMap.entries());
        console.log("ClientsMap: ", JSON.stringify(clientMapObject));
        // Get clientsMap logic goes here
        const command = {
            command: "getClientsMap",
            clientsMap: clientMapObject
        }
        sendAdminCommand(uuid, command);
        
    } catch (error) {
        next(error);
    }
});


    
export default routes;