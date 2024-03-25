// Import required modules
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { checkRole } from "../middleware/auth.js";

// Create an instance of Express
const router = express.Router();

// Define the GET route
router.get("/api/getFirmwareInfo", await checkRole(['admin']), (req, res) => {
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const files = getFiles("uploads");

  const firmwareInfo = {};

  // Loop through the files
  files.forEach((file) => {
    console.log(file);
    // Get the hwVersion and swVersion from the file name
    const [, hwVersion, swVersion] = file.split(path.sep);;

    // Check if the hwVersion already exists in the firmwareInfo object
    if (!firmwareInfo[hwVersion]) {
      firmwareInfo[hwVersion] = [];
    }

    // Add the swVersion to the firmwareInfo object
    firmwareInfo[hwVersion].push(swVersion);
  });

  // Send the firmwareInfo object as the response
  res.json(firmwareInfo);
});

function getFiles(dirPath) {
  let results = [];
  const list = fs.readdirSync(dirPath);

  list.forEach((file) => {
    file = path.join(dirPath, file);
    const stat = fs.statSync(file);

    if (stat && stat.isDirectory()) {
      // If directory, recurse into it
      results = results.concat(getFiles(file));
    } else {
      // If file, add it to the results
      results.push(file);
    }
  });

  return results;
}
// Export the router
export default router;
