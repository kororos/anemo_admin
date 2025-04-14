// Import required modules
import express from "express";
import { checkRole } from "../middleware/auth.js";
import { InfluxDB } from "@influxdata/influxdb-client";
import NodeCache from "node-cache";

// Create an instance of Express
const router = express.Router();

// Create a cache with a standard TTL of 10 seconds
const measurementsCache = new NodeCache({ stdTTL: 10, checkperiod: 12 });

// InfluxDB configuration
const url = process.env.INFLUXDB_URL || "http://localhost:8086";
const token = process.env.INFLUXDB_TOKEN || "";
const org = process.env.INFLUXDB_ORG || "anemo";
const bucket = process.env.INFLUXDB_BUCKET || "anemometer";

// Create InfluxDB client
const influxDB = new InfluxDB({ url, token });

// Define the GET route
router.get("/api/getMeasurements", await checkRole(['admin']), async (req, res) => {
  try {
    const deviceId = req.query.deviceId;
    
    // Validate deviceId parameter
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId parameter is required" });
    }
    
    // Check if measurements for this device are in cache
    const cacheKey = `measurements_${deviceId}`;
    const cachedMeasurements = measurementsCache.get(cacheKey);
    
    if (cachedMeasurements) {
      console.log(`Returning cached measurements for device ${deviceId}`);
      return res.json(cachedMeasurements);
    }
    
    // Not in cache, fetch from InfluxDB
    console.log(`Fetching measurements for device ${deviceId} from InfluxDB`);
    
    // Create query API
    const queryApi = influxDB.getQueryApi(org);
    
    // Flux query to get latest measurements for the device
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -10d)
        |> filter(fn: (r) => r.device == "${deviceId}")
        |> last()
    `;
    
    // Execute the query
    const measurements = [];
    
    // Process query results
    for await (const {values, tableMeta} of queryApi.iterateRows(fluxQuery)) {
      const o = tableMeta.toObject(values);
      measurements.push(o);
    }
    
    // Cache the results
    measurementsCache.set(cacheKey, measurements);
    
    // Return the measurements as JSON
    res.json(measurements);
  } catch (error) {
    console.error("Error fetching measurements:", error);
    res.status(500).json({ error: "Failed to fetch measurements" });
  }
});

// Export the router
export default router;