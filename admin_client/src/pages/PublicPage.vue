<template>
    <q-page padding>
        <!-- content -->
        <div class="flex column">
            <!-- Device selection -->
            <div class="row q-mb-md">
                <q-card class="col-12 q-mr-md q-mb-md q-mt-md">
                    <q-select 
                        class="q-pl-sm" 
                        v-model="selectedDevice" 
                        :options="combinedDevices" 
                        label="Select Device" 
                        option-label="label"
                    >
                        <template v-slot:option="scope">
                            <q-item v-bind="scope.itemProps">
                                <q-item-section>
                                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <q-badge v-if="scope.opt.connectionType === 'websocket'" color="positive">
                                        Realtime
                                    </q-badge>
                                    <q-badge v-else color="primary">
                                        Periodic
                                    </q-badge>
                                </q-item-section>
                            </q-item>
                        </template>
                        <template v-slot:selected>
                            <div class="row items-center">
                                {{ selectedDevice?.label }}
                                <q-badge v-if="selectedDevice?.connectionType === 'websocket'" class="q-ml-sm" color="positive">
                                    Realtime
                                </q-badge>
                                <q-badge v-else-if="selectedDevice" class="q-ml-sm" color="primary">
                                    Periodic
                                </q-badge>
                            </div>
                        </template>
                    </q-select>
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useWebSocketStore } from "src/stores/webSocketStore";
import axios from 'axios';
import GaugeD3 from 'src/components/GaugeD3.vue';
import CompassD3 from 'src/components/CompassD3.vue';
import VersionCard from 'src/components/VersionCard.vue';
import LastUpdateCard from 'src/components/LastUpdateCard.vue';

// Define props
const props = defineProps({
  deviceName: {
    type: String,
    default: '',
    required: false
  }
});

// Note that WebSocketStore has been initizaed in the boot/authBoot.js file
const wsStore = useWebSocketStore();

const speed = ref(0);
const temperature = ref(0);
const humidity = ref(0);
const direction = ref(0);
const firmwareVersion = ref('Unknown');
const lastUpdateTimestamp = ref('Unknown');
const apiDevices = ref([]);
const selectedDevice = ref(null);
let intervalId = null;

// Computed property to combine WebSocket and API devices
const combinedDevices = computed(() => {
    // Get WebSocket devices
    const wsDevices = wsStore.clients.map(client => {
        return {
            label: client.clientId || client.mac,
            value: client.uuid,
            mac: client.mac,
            data: client.data,
            connectionType: 'websocket',
            // Use swVersion property from WebSocket client data
            firmwareVersion: client.swVersion || 'Unknown'
        };
    });

    // Get API devices (not already in WebSocket devices)
    const uniqueApiDevices = apiDevices.value.filter(apiDevice => {
        // Check if this device is already in wsDevices by matching macAddress
        return !wsDevices.some(wsDevice => 
            wsDevice.mac === apiDevice.data?.macAddress
        );
    }).map(device => ({
        ...device,
        connectionType: 'api'
    }));

    // Combine and return
    return [...wsDevices, ...uniqueApiDevices];
});

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
            apiDevices.value = response.data.map(device => {
                // Use clientId as the value since this is what the InfluxDB uses in the 'device' field
                // The MQTT devices will be identified by their clientId in the database
                return {
                    label: device.clientId,
                    // The value must match what's expected by the /api/getMeasurements endpoint
                    // Based on router.js and measurementRouter.js, it should be the clientId
                    value: device.clientId,
                    data: device,
                    connectionType: 'api'
                }
            });
            console.log('Populated devices from API:', apiDevices.value);
            
            // Check if we need to select a device from URL parameter after devices are loaded
            if (props.deviceName && !selectedDevice.value) {
                const device = findDeviceByName(props.deviceName);
                if (device) {
                    console.log('Setting selected device from URL after API fetch:', device);
                    selectedDevice.value = device;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching guest devices:', error);
        apiDevices.value = [];
    }
}

// Fetch measurements from WebSocket data or API
const fetchMeasurements = async () => {
    if (!selectedDevice.value) return;

    // First try to get data from WebSocket if it's a websocket-connected device
    if (selectedDevice.value.connectionType === 'websocket') {
        const client = wsStore.clients.find(client => 
            client.uuid === selectedDevice.value.value || 
            client.clientId === selectedDevice.value.value
        );

        if (client && client.data && client.data.sensors) {
            updateMeasurementsFromWebSocket(client);
            return;
        }
    }
    
    // If it's not a websocket device or websocket data isn't available, try API
    await fetchMeasurementsFromAPI();
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

    // Update firmware version from the swVersion property
    if (client.swVersion) {
        firmwareVersion.value = client.swVersion;
        lastUpdateTimestamp.value = new Date().toISOString();
        console.log('Updated firmware version from WebSocket:', client.swVersion);
    } else {
        console.log('No swVersion available in client:', client);
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

        // Get device ID from selected device
        // The API expects a client ID that matches the device's ID in InfluxDB
        const deviceId = selectedDevice.value.value;
        
        console.log(`Fetching measurements for device ID: ${deviceId}`);
        
        const response = await axiosInstance.get('/api/getMeasurements', {
            params: { deviceId }
        });

        console.log('API measurements response:', response.data);

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const data = response.data;
            let hasUpdatedAnyValue = false;
            let foundVersionData = false;

            // Find direction sensor data
            const directionSensor = data.find(item => item._field === 'direction');
            if (directionSensor) {
                direction.value = directionSensor._value || direction.value;
                hasUpdatedAnyValue = true;
            }

            // Find temperature sensor data
            const tempSensor = data.find(item => item._field === 'temp');
            if (tempSensor) {
                temperature.value = tempSensor._value || temperature.value;
                hasUpdatedAnyValue = true;
            }

            // Find humidity sensor data
            const humiditySensor = data.find(item => item._field === 'hummidity');
            if (humiditySensor) {
                humidity.value = humiditySensor._value || humidity.value;
                hasUpdatedAnyValue = true;
            }

            // Find rotPerSec sensor data and convert to knots
            const rotPerSecSensor = data.find(item => item._field === 'rotPerSec');
            if (rotPerSecSensor) {
                speed.value = rotPerSecSensor._value * 1.46 || speed.value;
                if (speed.value >= 1) speed.value = speed.value + 1;
                hasUpdatedAnyValue = true;
            }

            // Find firmware version data
            const versionData = data.find(item => item._field === 'version');
            if (versionData) {
                firmwareVersion.value = versionData._value;
                lastUpdateTimestamp.value = versionData._time || lastUpdateTimestamp.value;
                hasUpdatedAnyValue = true;
                foundVersionData = true;
            }
            
            if (hasUpdatedAnyValue) {
                console.log('Updated values from API:', {
                    direction: direction.value,
                    temperature: temperature.value,
                    humidity: humidity.value,
                    speed: speed.value,
                    firmwareVersion: firmwareVersion.value,
                    lastUpdateTimestamp: lastUpdateTimestamp.value
                });
            } else {
                console.log('API returned data but no measurement values were updated for device:', deviceId);
            }
            
            // If we have measurements but no version data, set version to Unknown
            if (hasUpdatedAnyValue && !foundVersionData) {
                firmwareVersion.value = 'Unknown';
                lastUpdateTimestamp.value = 'Unknown';
                console.log('Measurements found but no version data, setting firmware version to Unknown');
            }
        } else {
            // No data returned from API, use device data if available or set to Unknown
            console.log('No data returned from API for device:', deviceId);
            
            // Try to get firmware version from device metadata if available
            if (selectedDevice.value.data?.fwVersion) {
                firmwareVersion.value = selectedDevice.value.data.fwVersion;
                // If we have a firmware version but no timestamp, use current time
                if (lastUpdateTimestamp.value === 'Unknown') {
                    lastUpdateTimestamp.value = new Date().toISOString();
                }
                console.log('Using firmware version from device metadata:', firmwareVersion.value);
            } else {
                // No data and no device metadata - set everything to Unknown/0
                firmwareVersion.value = 'Unknown';
                lastUpdateTimestamp.value = 'Unknown';
                // Reset measurement values to 0 for MQTT devices with no data
                if (selectedDevice.value.connectionType === 'api') {
                    speed.value = 0;
                    temperature.value = 0;
                    humidity.value = 0;
                    direction.value = 0;
                    console.log('No data for MQTT device, resetting all values');
                }
            }
        }
    } catch (error) {
        console.error('Error fetching guest measurements:', error);
        // Set firmware and timestamp to Unknown for API errors
        firmwareVersion.value = 'Unknown';
        lastUpdateTimestamp.value = 'Unknown';
        console.log('Error fetching measurements, setting firmware version to Unknown');
    }
};

// Helper function to reset all values
const resetValues = () => {
    // Reset measurement values
    speed.value = 0;
    temperature.value = 0;
    humidity.value = 0;
    direction.value = 0;
    
    // Keep firmware version from device data if available, otherwise reset
    if (selectedDevice.value?.data?.fwVersion || 
        selectedDevice.value?.firmwareVersion || 
        selectedDevice.value?.swVersion) {
        firmwareVersion.value = selectedDevice.value.data?.fwVersion || 
                               selectedDevice.value.firmwareVersion || 
                               selectedDevice.value.swVersion;
        // Keep last update time if we're keeping the same firmware version
        // otherwise reset to current time
        if (lastUpdateTimestamp.value === 'Unknown') {
            lastUpdateTimestamp.value = new Date().toISOString();
        }
    } else {
        firmwareVersion.value = 'Unknown';
        lastUpdateTimestamp.value = 'Unknown';
    }
    
    console.log('Values reset:', { 
        speed: speed.value,
        temperature: temperature.value, 
        humidity: humidity.value, 
        direction: direction.value,
        firmwareVersion: firmwareVersion.value,
        lastUpdateTimestamp: lastUpdateTimestamp.value
    });
};

// Subscribe to WebSocket store updates for real-time data
wsStore.$subscribe((mutation, state) => {
    console.log('WebSocket store updated:', state.clients);
    
    // If we have a device name from URL but no device selected yet, check if it's available now
    if (props.deviceName && !selectedDevice.value && state.clients.length > 0) {
        // Try to find the device by name in the WebSocket clients
        const wsDevice = state.clients.find(client => 
            client.clientId === props.deviceName || client.mac === props.deviceName
        );
        
        if (wsDevice) {
            console.log('Found device from URL parameter in WebSocket clients:', wsDevice);
            selectedDevice.value = {
                label: wsDevice.clientId || wsDevice.mac,
                value: wsDevice.uuid,
                mac: wsDevice.mac,
                data: wsDevice.data,
                connectionType: 'websocket',
                firmwareVersion: wsDevice.swVersion || 'Unknown'
            };
        }
    }
    
    // If the selected device is a WebSocket device, update its data
    if (selectedDevice.value && selectedDevice.value.connectionType === 'websocket') {
        // Find client by uuid
        const client = state.clients.find(client => client.uuid === selectedDevice.value.value);
        if (client) {
            // Log the found client to debug
            console.log('Found selected client in WS update:', client);
            
            // Check for firmware version even if no sensor data yet
            if (client.swVersion) {
                firmwareVersion.value = client.swVersion;
                lastUpdateTimestamp.value = new Date().toISOString();
                console.log('Updated firmware from WS subscription:', client.swVersion);
            }
            
            // Update sensor data if available
            if (client.data && client.data.sensors) {
                updateMeasurementsFromWebSocket(client);
            }
        }
    }
    
    // NOTE: We're not updating the devices list here because we don't want to
    // overwrite API devices - the combinedDevices computed property takes care of this
});

// Watch for changes to the selected device
// When changed, fetch measurements for that device
watch(selectedDevice, (newDevice, oldDevice) => {
    if (newDevice) {
        // Only reset values if changing to a completely different device
        // This prevents resetting when simply refreshing the same device
        if (!oldDevice || newDevice.value !== oldDevice.value) {
            console.log('Device changed, resetting values before fetching new measurements');
            
            // Always reset firmware version and timestamp when changing devices
            firmwareVersion.value = 'Unknown';
            lastUpdateTimestamp.value = 'Unknown';
            
            // Reset other values
            resetValues();
            
            console.log('Initial values after device change:', {
                speed: speed.value,
                temperature: temperature.value,
                humidity: humidity.value,
                direction: direction.value,
                firmwareVersion: firmwareVersion.value,
                lastUpdateTimestamp: lastUpdateTimestamp.value
            });
        }
        
        // Immediately fetch measurements for the new device
        fetchMeasurements();
    } else {
        // If no device is selected, reset all values
        resetValues();
        firmwareVersion.value = 'Unknown';
        lastUpdateTimestamp.value = 'Unknown';
    }
});

// Find a device by name (clientId) in the available devices
const findDeviceByName = (deviceName) => {
    if (!deviceName) return null;
    
    console.log('Looking for device with name:', deviceName);
    
    // First try WebSocket connected devices
    const wsDevice = wsStore.clients.find(client => 
        client.clientId === deviceName || client.mac === deviceName
    );
    
    if (wsDevice) {
        console.log('Found device in WebSocket clients:', wsDevice);
        return {
            label: wsDevice.clientId || wsDevice.mac,
            value: wsDevice.uuid,
            mac: wsDevice.mac,
            data: wsDevice.data,
            connectionType: 'websocket',
            firmwareVersion: wsDevice.swVersion || 'Unknown'
        };
    }
    
    // Then try API devices
    const apiDevice = apiDevices.value.find(device => 
        device.label === deviceName || device.data?.macAddress === deviceName
    );
    
    if (apiDevice) {
        console.log('Found device in API devices:', apiDevice);
        return apiDevice;
    }
    
    console.log('Device not found with name:', deviceName);
    return null;
};

onMounted(async () => {
    console.log('Route device parameter:', props.deviceName);
    
    // Initialize WebSocket connection if it's not already initialized
    wsStore.initializeWebSocket();

    // Populate devices dropdown from guest API endpoint
    await populateDevices();

    // Select device from URL parameter if provided
    if (props.deviceName) {
        // Wait a bit for WebSocket to initialize devices
        setTimeout(() => {
            const device = findDeviceByName(props.deviceName);
            if (device) {
                console.log('Setting selected device from URL parameter:', device);
                selectedDevice.value = device;
            } else {
                console.log('Device from URL parameter not found');
            }
        }, 1000); // Give WebSocket connection time to establish
    }

    // Set up interval to fetch measurements
    // - For API devices, this will refresh their data periodically
    // - For WebSocket devices, this is a fallback if WebSocket updates stop
    // - Setting to 5 seconds to avoid overwhelming the API but keep display updated
    // - The server has a 10s cache so more frequent calls would hit the cache anyway
    intervalId = setInterval(() => {
        if (selectedDevice.value) {
            fetchMeasurements();
            
            // Every 30 seconds, refresh the device list from the API to discover new devices
            if ((Date.now() / 1000) % 30 < 5) {
                populateDevices();
            }
        }
    }, 5000);
});

onUnmounted(() => {
    // Clear the interval when component is unmounted
    if (intervalId !== null) {
        clearInterval(intervalId);
    }
});
</script>