<template>
    <q-page padding>
        <!-- content -->
        <div class="flex column">
            <!-- Device selection -->
            <div class="row q-mb-md">
                <q-card class="col-12 q-mr-md q-mb-md q-mt-md">
                    <q-select class="q-pl-sm" v-model="selectedDevice" :options="devices" label="Select Device" />
                </q-card>
            </div>

            <!-- D3 components row -->
            <div class="row items-center justify-between q-mb-md">
                <q-card class="col-xs-12 col-sm q-mr-md q-mb-md">
                    <q-card-section>
                        <div class="text-center text-h6 text-no-wrap">Wind Direction</div>
                    </q-card-section>
                    <CompassD3 id="compass" :arrowAngle="direction" />
                </q-card>
                <q-card class="col-xs-12 col-sm q-mr-md q-mb-md">
                    <q-card-section>
                        <div class="text-center text-h6 text-no-wrap">Wind Speed</div>
                    </q-card-section>
                    <GaugeD3 class="justify-center " :value="speed" :valueMax="30" :innerRadius="60" :outerRadius="80"
                        id="speed1" />
                </q-card>
                <q-card class="col-xs-12 col-sm q-mr-md q-mb-md">
                    <q-card-section>
                        <div class="text-center text-h6">Temperature</div>
                    </q-card-section>
                    <GaugeD3 :value="temperature" :valueMax="45" id="temperature" />
                </q-card>
                <q-card class="col-xs-12 col-sm q-mb-md">
                    <q-card-section>
                        <div class="text-center text-h6">Humidity</div>
                    </q-card-section>
                    <GaugeD3 :value="humidity" :valueMax="100" id="humidity" />
                </q-card>
            </div>

            <!-- Version and last update row - responsive layout -->
            <div class="row items-center justify-between q-mb-md">
                <q-card class="col-xs-12 col-sm q-mr-md q-mb-md">
                    <VersionCard :fw-version="firmwareVersion" />
                </q-card>
                <q-card class="col-xs-12 col-sm  q-mb-md">
                    <LastUpdateCard :timestamp="lastUpdateTimestamp" />
                </q-card>
            </div>
        </div>
    </q-page>
</template>


<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useWebSocketStore } from "src/stores/webSocketStore";
import axios from 'axios';
import GaugeD3 from 'src/components/GaugeD3.vue';
import CompassD3 from 'src/components/CompassD3.vue';
import VersionCard from 'src/components/VersionCard.vue';
import LastUpdateCard from 'src/components/LastUpdateCard.vue';

// Note that WebSocketStore has been initizaed in the boot/authBoot.js file
const wsStore = useWebSocketStore();

const speed = ref(0);
const temperature = ref(0);
const humidity = ref(0);
const direction = ref(0);
const firmwareVersion = ref('Unknown');
const lastUpdateTimestamp = ref('Unknown');
const devices = ref([]);
const selectedDevice = ref(null);
let intervalId = null;

// Populate the devices dropdown from the getKnownDevicesGuest endpoint
const populateDevices = async () => {
    try {
        // Create a direct axios instance for guest access
        const axiosInstance = axios.create({
            baseURL: process.env.API_BASE_URL || "http://localhost:3000",
            withCredentials: true,
        });

        const response = await axiosInstance.get('/api/getKnownDevices');
        console.log('Known devices guest response:', response.data);

        if (response.data && Array.isArray(response.data)) {
            // Map API response to dropdown options
            devices.value = response.data.map(device => {
                return {
                    label: device.clientId,
                    value: device.uuid || device.clientId,
                    data: device
                }
            });
            console.log('Populated devices from API:', devices.value);
        }
    } catch (error) {
        console.error('Error fetching guest devices:', error);
        // Fallback to WebSocket clients if API call fails
        fallbackToWebSocketClients();
    }
}

// Fallback to WebSocket clients if API call fails
const fallbackToWebSocketClients = () => {
    if (wsStore.clients && wsStore.clients.length > 0) {
        devices.value = wsStore.clients.map(client => {
            return {
                label: client.clientId || client.mac,
                value: client.uuid
            }
        });
        console.log('Fallback: Populated devices from WebSocket store:', devices.value);
    } else {
        console.log('No clients available in WebSocket store');
    }
}


// Fetch measurements from WebSocket data or API
const fetchMeasurements = async () => {
    if (!selectedDevice.value) return;

    // First try to get data from WebSocket
    const client = wsStore.clients.find(client => client.uuid === selectedDevice.value.value ||
        client.clientId === selectedDevice.value.value);

    if (client && client.data && client.data.sensors) {
        updateMeasurementsFromWebSocket(client);
    } else {
        // If no WebSocket data, try API
        await fetchMeasurementsFromAPI();
    }
};

// Update measurements from WebSocket data
const updateMeasurementsFromWebSocket = (client) => {
    if (!client || !client.data || !client.data.sensors) {
        resetValues();
        return;
    }

    // Find and update speed value
    const speedSensor = client.data.sensors.find(item => item.sensor === 'speed');
    if (speedSensor) {
        speed.value = speedSensor.data.rotPerSec * 1.46 || 0;
        if (speed.value >= 1) speed.value = speed.value + 1;
    }

    // Find and update direction value
    const directionSensor = client.data.sensors.find(item => item.sensor === 'magneto');
    if (directionSensor) {
        direction.value = directionSensor.data || 0;
    }

    // Find and update temperature value
    const tempSensor = client.data.sensors.find(item => item.sensor === 'temperature');
    if (tempSensor) {
        temperature.value = tempSensor.data || 0;
    }

    // Find and update humidity value
    const humiditySensor = client.data.sensors.find(item => item.sensor === 'humidity');
    if (humiditySensor) {
        humidity.value = humiditySensor.data || 0;
    }

    // Handle firmware version if available in websocket data
    if (client.firmwareVersion) {
        firmwareVersion.value = client.firmwareVersion;
        lastUpdateTimestamp.value = new Date().toISOString();
    }
};

// Fetch measurements from API as fallback
const fetchMeasurementsFromAPI = async () => {
    try {
        // Create a direct axios instance for guest access
        const axiosInstance = axios.create({
            baseURL: process.env.API_BASE_URL || "http://localhost:3000",
            withCredentials: true,
        });

        const response = await axiosInstance.get('/api/getMeasurements', {
            params: { deviceId: selectedDevice.value.value }
        });

        if (response.data && Array.isArray(response.data)) {
            const data = response.data;

            // Find direction sensor data
            const directionSensor = data.find(item => item._field === 'direction');
            if (directionSensor) {
                direction.value = directionSensor._value || 0;
            }

            // Find temperature sensor data
            const tempSensor = data.find(item => item._field === 'temp');
            if (tempSensor) {
                temperature.value = tempSensor._value || 0;
            }

            // Find humidity sensor data
            const humiditySensor = data.find(item => item._field === 'hummidity');
            if (humiditySensor) {
                humidity.value = humiditySensor._value || 0;
            }

            // Find rotPerSec sensor data and convert to knots
            const rotPerSecSensor = data.find(item => item._field === 'rotPerSec');
            if (rotPerSecSensor) {
                speed.value = rotPerSecSensor._value * 1.46 || 0;
                if (speed.value >= 1) speed.value = speed.value + 1;
            }

            // Find firmware version data
            const versionData = data.find(item => item._field === 'version');
            if (versionData) {
                firmwareVersion.value = versionData._value;
                lastUpdateTimestamp.value = versionData._time || 'Unknown';
            } else {
                firmwareVersion.value = 'Unknown';
                lastUpdateTimestamp.value = 'Unknown';
            }
        } else {
            // Reset values if no data is available
            resetValues();
        }
    } catch (error) {
        console.error('Error fetching guest measurements:', error);
        resetValues();
    }
};

// Helper function to reset all values
const resetValues = () => {
    speed.value = 0;
    temperature.value = 0;
    humidity.value = 0;
    direction.value = 0;
    firmwareVersion.value = 'Unknown';
    lastUpdateTimestamp.value = 'Unknown';
};

// Also keep the websocket subscription for real-time updates
wsStore.$subscribe((mutation, state) => {
    // Update devices list from WebSocket state
    devices.value = state.clients.map(client => {
        return {
            label: client.clientId,
            value: client.uuid // Use uuid as in original PublicPage
        }
    });

    // If no device is selected or if the selected device is not in the client list, reset values
    if (!selectedDevice.value) {
        resetValues();
        return;
    }

    // Find client by uuid as in original PublicPage
    const client = state.clients.find(client => client.uuid === selectedDevice.value.value);
    if (!client || !client.data) {
        resetValues();
    } else {
        // Update values from WebSocket
        if (client.data.sensors) {
            const speedSensor = client.data.sensors.find(item => item.sensor === 'speed');
            if (speedSensor) {
                speed.value = speedSensor.data.rotPerSec * 1.46 || 0;
                if (speed.value >= 1) speed.value = speed.value + 1;
            }

            const directionSensor = client.data.sensors.find(item => item.sensor === 'magneto');
            if (directionSensor) {
                direction.value = directionSensor.data || 0;
            }

            const tempSensor = client.data.sensors.find(item => item.sensor === 'temperature');
            if (tempSensor) {
                temperature.value = tempSensor.data || 0;
            }

            const humiditySensor = client.data.sensors.find(item => item.sensor === 'humidity');
            if (humiditySensor) {
                humidity.value = humiditySensor.data || 0;
            }

            // Handle firmware version if available in websocket data
            if (client.firmwareVersion) {
                firmwareVersion.value = client.firmwareVersion;
                lastUpdateTimestamp.value = new Date().toISOString();
            }
        }
    }
});

// Watch for changes to the selected device
// When changed, fetch measurements for that device
watch(selectedDevice, () => {
    if (selectedDevice.value) {
        fetchMeasurements();
    } else {
        resetValues();
    }
});

onMounted(async () => {
    // Initialize WebSocket connection if it's not already initialized
    wsStore.initializeWebSocket();

    // Populate devices dropdown from guest API endpoint
    await populateDevices();

    // Set up interval to fetch measurements every 2 seconds
    intervalId = setInterval(fetchMeasurements, 2000);
});

onUnmounted(() => {
    // Clear the interval when component is unmounted
    if (intervalId !== null) {
        clearInterval(intervalId);
    }
});
</script>