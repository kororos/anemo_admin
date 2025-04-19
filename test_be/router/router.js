import express from 'express';
import { sendCommand as sendAnemoCommand, getClientsMap } from "../anemoWebSocket.js";
import { sendAdminCommand } from "../adminWebSocket.js";
import { checkRole } from '../middleware/auth.js';
import db from '../db/models/index.js';
import { Sequelize } from 'sequelize';

const routes = express.Router();
routes.post('/api/restart', await checkRole(['admin']), async (req, res, next) => {
    // Restart logic goes here
    const uuid = req.body.uuid;
    const mac = req.body.mac;
    const currentFwVersion = req.body.currentFwVersion;
    const currentHwVersion = req.body.currentHwVersion;

    // Insert into FirmwareUpdates table a new row with the UUID of the client and the max ID for the firmware for the same hwVersion
    try {
        const firmware = await db.Firmware.findOne({
            where: { hwVersion: currentHwVersion },
            order: [['id', 'DESC']]
        });
        if (!firmware) {
            res.status(400).json({ message: 'No firmware found for the given hwVersion' });
            return
        }
        console.log("firmware: ", firmware);
        const firmwareUpdate = await db.PendingUpdates.create({
            UUID: uuid,
            macAddress: mac,
            currentFwVersion: currentFwVersion,
            requestedFwVersion: firmware.swVersion,
            initiatorUserId: req.userId,
            status: currentFwVersion == firmware.swVersion ? 'COMPLETED' : 'PENDING'
        });
        console.log("firmwareUpdate: ", firmwareUpdate);
        try {
            // Restart logic
            const command = {
                command: "restart",
                mac: mac,
                uuid: uuid
            }
            sendAnemoCommand(command);
            res.send('Server restarted successfully');
        } catch (error) {
            console.error('Error: ', error);
            res.status(500).json({ message: 'An error occurred while sending restart command to anemometer' });
        }
    } catch (error) {
        console.error("error: ", error);
        if (error instanceof Sequelize.ValidationError) {
            res.status(400).json({ message: error.message })
        } else if (error instanceof Sequelize.DatabaseError) {
            res.status(500).json({ message: 'An error occurred during creating the PendingUpdate in DB' });
        } else {
            res.status(500).json({ message: 'An error occurred while fetching the firmware from DB' });
        }
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

routes.get('/api/getKnownDevices', await checkRole(['admin', 'guest']), async (req, res, next) => {
    try {
        const devices = await db.Device.findAll({
            attributes: ['id', ['name', 'clientId'], 'hwVersion', 'fwVersion', 'macAddress', 'lastConnection', 'arcStart', 'arcEnd']
        });
        console.log("devices; ", JSON.stringify(devices, null, 2));
        res.json(devices);
    } catch (error) {
        res.status(403).send(error.message);
    }
});

routes.put('/api/updateDeviceArc', await checkRole(['admin']), async (req, res, next) => {
    try {
        const { id, arcStart, arcEnd } = req.body;
        
        // Validate input
        if (!id) {
            return res.status(400).json({ message: 'Device ID is required' });
        }
        
        // Convert to numbers or null for empty values
        const start = arcStart === null || arcStart === '' || arcStart === undefined ? null : Number(arcStart);
        const end = arcEnd === null || arcEnd === '' || arcEnd === undefined ? null : Number(arcEnd);
        
        // Validation for non-null values
        if ((start !== null && (isNaN(start) || start < 0 || start > 360)) || 
            (end !== null && (isNaN(end) || end < 0 || end > 360))) {
            return res.status(400).json({ message: 'Arc values must be between 0 and 360 degrees' });
        }
        
        // Ensure arcEnd is greater than arcStart only if both are provided
        if (start !== null && end !== null && start >= end) {
            return res.status(400).json({ message: 'Arc End must be greater than Arc Start' });
        }
        
        // Update the device
        const device = await db.Device.findByPk(id);
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }
        
        await device.update({
            arcStart: start,
            arcEnd: end
        });
        
        res.json({ 
            message: 'Device arc settings updated successfully',
            device: {
                id: device.id,
                arcStart: device.arcStart,
                arcEnd: device.arcEnd
            }
        });
    } catch (error) {
        console.error('Error updating device arc settings:', error);
        res.status(500).json({ message: 'An error occurred while updating device arc settings' });
    }
});



export default routes;