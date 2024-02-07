import  express from 'express';
import multer from 'multer';
import { sendCommand as sendAnemoCommand, getClientsMap} from "../anemoWebSocket.js";
import { sendAdminCommand } from "../adminWebSocket.js";
const routes = express.Router();
const upload = multer();
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

routes.post('/api/getClients', (req, res, next) => {
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

routes.post('/api/firmwareUpload', upload.single('file'), (req, res, next) => {
    // # handle form data
    
    // # handle file upload
    const file = req.file;
    console.log("file: ", file);
    // Process the uploaded file here
    const hwVersion = req.body.hwVersion;
    console.log("hwVersion: ", hwVersion);

    const swVersion = req.body.swVersion;
    console.log("swVersion: ", swVersion);
    // Process the uploaded firmware here
    
    // # send response
    res.send('Firmware uploaded and updated successfully');
});
    
export default routes;