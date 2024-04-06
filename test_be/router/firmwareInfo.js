// Import required modules
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { checkRole } from "../middleware/auth.js";
import db from "../db/models/index.js";

// Create an instance of Express
const router = express.Router();

// Define the GET route
router.get("/api/getFirmwareInfo", await checkRole(['admin']), async (req, res) => {
  try{
    const firmwares = await db.Firmware.findAll({
      attributes: ['id','hwVersion', 'swVersion', 'createdAt', 'updatedAt']
    });
    console.log("firmwares; ", JSON.stringify(firmwares, null, 2));
    res.json(firmwares);
  }catch(error){
    res.status(403).send(error.message);
  }
});

// Export the router
export default router;
