<template>
  <div class="measurements-display">
    <!-- Device selection (only shown if showDeviceSelector is true) -->
    <div v-if="showDeviceSelector" class="row q-mb-md">
      <q-card class="col-12 q-mr-md q-mb-md q-mt-md">
        <q-select 
          class="q-pl-sm" 
          v-model="selectedDevice" 
          :options="combinedDevices" 
          label="Select Device" 
          option-label="label"
          :loading="devicesStore.isLoading"
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
        <CompassD3 
          id="compass" 
          :arrowAngle="direction" 
          :arcStart="arcSettings.arcStart" 
          :arcEnd="arcSettings.arcEnd" 
        />
      </q-card>
      <q-card class="col-xs-12 col-sm q-mr-md q-mb-md">
        <q-card-section>
          <div class="text-center text-h6 text-no-wrap">Wind Speed</div>
        </q-card-section>
        <GaugeD3 :value="speed" :valueMax="30" id="speed1" />
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

    <!-- Measurements chart (only shown for authenticated users) -->
    <div v-if="showMeasurementsChart" class="row q-mb-md">
      <q-card class="col-12 q-mr-md q-mb-md">
        <q-card-section>
          <div class="text-center text-h6" id="measurements">Measurements</div>
        </q-card-section>
        <MeasurementsD3 id="measurements" :device="selectedDeviceId" />
      </q-card>
    </div>

    <!-- Version and last update row - responsive layout -->
    <div class="row items-center justify-between q-mb-md">
      <q-card class="col-xs-12 col-sm q-mr-md q-mb-md">
        <VersionCard :fw-version="firmwareVersion" />
      </q-card>
      <q-card class="col-xs-12 col-sm q-mb-md">
        <LastUpdateCard 
          :timestamp="lastUpdateTimestamp" 
          :deviceSelected="isDeviceSelected" 
        />
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useWebSocketStore } from "src/stores/webSocketStore";
import { useDevicesStore } from "src/stores/devicesStore";
import axios from 'axios';
import GaugeD3 from 'src/components/GaugeD3.vue';
import CompassD3 from 'src/components/CompassD3.vue';
import VersionCard from 'src/components/VersionCard.vue';
import LastUpdateCard from 'src/components/LastUpdateCard.vue';
import MeasurementsD3 from 'src/components/MeasurementsD3.vue';

// Define props
const props = defineProps({
  deviceName: {
    type: String,
    default: '',
    required: false
  },
  showDeviceSelector: {
    type: Boolean,
    default: true
  },
  fixedDeviceId: {
    type: String,
    default: ''
  },
  showMeasurementsChart: {
    type: Boolean,
    default: false
  },
  authenticated: {
    type: Boolean,
    default: false
  }
});

// Get stores
const wsStore = useWebSocketStore();
const devicesStore = useDevicesStore();

// Measurements data
const speed = ref(0);
const temperature = ref(0);
const humidity = ref(0);
const direction = ref(0);
const firmwareVersion = ref('Unknown');
const lastUpdateTimestamp = ref('Unknown');
const selectedDevice = ref(null);
let intervalId = null;

// Computed property for the selected device ID (for API calls)
const selectedDeviceId = computed(() => {
  if (props.fixedDeviceId) {
    return props.fixedDeviceId;
  }
  return selectedDevice.value?.value || '';
});

// Computed property to check if a device is selected
const isDeviceSelected = computed(() => {
  return !!props.fixedDeviceId || !!selectedDevice.value;
});

// Get arc settings from the DevicesStore
const arcSettings = computed(() => {
  // If we have a selected device with a MAC address, use it to look up arc settings
  if (selectedDevice.value?.mac) {
    console.log('Using MAC address for arc settings:', selectedDevice.value.mac);
    // Look up device by MAC address in the devices store
    const device = devicesStore.getDeviceByMac(selectedDevice.value.mac);
    if (device) {
      console.log('Found device by MAC in devices store:', device.macAddress);
      return {
        arcStart: device.arcStart ?? 0,
        arcEnd: device.arcEnd ?? 180
      };
    }
  }
  
  // If we have a fixed deviceId, try to find a corresponding device
  const deviceId = selectedDeviceId.value;
  if (deviceId) {
    // First, check if it's a MAC address by looking for colons
    if (deviceId.includes(':')) {
      const device = devicesStore.getDeviceByMac(deviceId);
      if (device) {
        console.log('Found device by MAC in devices store from deviceId:', deviceId);
        return {
          arcStart: device.arcStart ?? 0,
          arcEnd: device.arcEnd ?? 180
        };
      }
    }
    
    // Otherwise, try to find by client ID
    const device = devicesStore.getDeviceById(deviceId);
    if (device) {
      console.log('Found device by ID in devices store:', deviceId);
      return {
        arcStart: device.arcStart ?? 0,
        arcEnd: device.arcEnd ?? 180
      };
    }
  }
  
  // Default values if no matching device is found
  console.log('No matching device found, using default arc values');
  return { arcStart: 0, arcEnd: 180 };
});

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
      firmwareVersion: client.swVersion || 'Unknown'
    };
  });

  // Get stored devices (not already in WebSocket devices)
  const storedDevices = devicesStore.devices.filter(device => {
    // Check if this device is already in wsDevices by matching macAddress
    return !wsDevices.some(wsDevice => 
      wsDevice.mac === device.macAddress
    );
  }).map(device => {
    // Log each device as we process it
    console.log(`Processing stored device: ${device.clientId}, MAC: ${device.macAddress}, arcStart: ${device.arcStart}, arcEnd: ${device.arcEnd}`);
    
    return {
      label: device.clientId,
      value: device.clientId,
      mac: device.macAddress, // Add the MAC address explicitly
      arcStart: device.arcStart, // Include arcStart directly in the dropdown item
      arcEnd: device.arcEnd,     // Include arcEnd directly in the dropdown item
      data: device,
      connectionType: 'api'
    };
  });

  // Combine and return
  return [...wsDevices, ...storedDevices];
});

// Format date for the Last Seen column
const formatDateTime = (dateString) => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  
  // Format: dd-mm-yy hh:mm:ss
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

// Fetch measurements from WebSocket data or API
const fetchMeasurements = async () => {
  const deviceId = selectedDeviceId.value;
  if (!deviceId) return;

  // First check if the deviceId is a clientId for a WebSocket device
  const wsClientByClientId = wsStore.clients.find(client => 
    client.clientId === deviceId || client.mac === deviceId
  );
  
  if (wsClientByClientId && wsClientByClientId.data && wsClientByClientId.data.sensors) {
    updateMeasurementsFromWebSocket(wsClientByClientId);
    return;
  }
  
  // Then try by UUID (for devices that were specifically selected as WebSocket devices)
  if (selectedDevice.value?.connectionType === 'websocket') {
    const client = wsStore.clients.find(client => 
      client.uuid === deviceId || 
      client.clientId === deviceId
    );

    if (client && client.data && client.data.sensors) {
      updateMeasurementsFromWebSocket(client);
      return;
    }
  }
  
  // If it's not a websocket device or websocket data isn't available, try API
  await fetchMeasurementsFromAPI(deviceId);
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
  }
};

// Fetch measurements from API as fallback
const fetchMeasurementsFromAPI = async (deviceId) => {
  try {
    // Create axios instance based on whether we're authenticated
    const axiosInstance = props.authenticated 
      ? (await import('src/boot/axios')).api
      : axios.create({
          baseURL: process.env.API_BASE_URL || "http://localhost:3000",
          withCredentials: true,
        });
    
    const response = await axiosInstance.get('/api/getMeasurements', {
      params: { deviceId }
    });

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
      
      // If we have measurements but no version data, set version to Unknown
      if (hasUpdatedAnyValue && !foundVersionData) {
        firmwareVersion.value = 'Unknown';
        lastUpdateTimestamp.value = 'Unknown';
      }
    } else {
      // No data returned from API, use device data if available or set to Unknown
      
      // Try to get firmware version from device metadata if available
      if (selectedDevice.value?.data?.fwVersion) {
        firmwareVersion.value = selectedDevice.value.data.fwVersion;
        // Always set timestamp to Unknown if no data was returned from API
        lastUpdateTimestamp.value = 'Unknown';
      } else {
        // No data and no device metadata - set everything to Unknown/0
        firmwareVersion.value = 'Unknown';
        lastUpdateTimestamp.value = 'Unknown';
        // Reset measurement values to 0 for MQTT devices with no data
        if (selectedDevice.value?.connectionType === 'api') {
          speed.value = 0;
          temperature.value = 0;
          humidity.value = 0;
          direction.value = 0;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching measurements:', error);
    // Set firmware and timestamp to Unknown for API errors
    firmwareVersion.value = 'Unknown';
    lastUpdateTimestamp.value = 'Unknown';
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
    // If we have a firmware version but no timestamp, leave timestamp as Unknown
    if (lastUpdateTimestamp.value === 'Unknown') {
      lastUpdateTimestamp.value = 'Unknown';
    }
  } else {
    firmwareVersion.value = 'Unknown';
    lastUpdateTimestamp.value = 'Unknown';
  }
};

// Find a device by name or MAC address
const findDeviceByName = (deviceNameOrMac) => {
  if (!deviceNameOrMac) return null;
  
  console.log('Finding device by name/MAC:', deviceNameOrMac);
  
  // Check if the input looks like a MAC address (contains colons)
  const isMacAddress = deviceNameOrMac.includes(':');
  
  // First try WebSocket connected devices
  let wsDevice;
  
  if (isMacAddress) {
    // If it looks like a MAC address, prioritize MAC matching
    wsDevice = wsStore.clients.find(client => client.mac === deviceNameOrMac);
    console.log('Searching WebSocket clients by MAC:', wsDevice ? 'Found' : 'Not found');
  } else {
    // Otherwise try to match by clientId or MAC
    wsDevice = wsStore.clients.find(client => 
      client.clientId === deviceNameOrMac || client.mac === deviceNameOrMac
    );
    console.log('Searching WebSocket clients by ID:', wsDevice ? 'Found' : 'Not found');
  }
  
  if (wsDevice) {
    // When returning from WebSocket, ensure we include the MAC address
    console.log('Found device in WebSocket clients, MAC:', wsDevice.mac);
    return {
      label: wsDevice.clientId || wsDevice.mac,
      value: wsDevice.uuid,
      mac: wsDevice.mac,
      data: wsDevice.data,
      connectionType: 'websocket',
      firmwareVersion: wsDevice.swVersion || 'Unknown'
    };
  }
  
  // Then try devices from the store
  let storeDevice;
  
  if (isMacAddress) {
    // If it looks like a MAC address, prioritize MAC matching
    storeDevice = devicesStore.getDeviceByMac(deviceNameOrMac);
    console.log('Searching devices store by MAC:', storeDevice ? 'Found' : 'Not found');
  } else {
    // Otherwise try to match by clientId
    storeDevice = devicesStore.getDeviceById(deviceNameOrMac);
    console.log('Searching devices store by ID:', storeDevice ? 'Found' : 'Not found');
  }
  
  if (storeDevice) {
    // When returning from store, ensure we include the MAC address
    console.log('Found device in devices store, MAC:', storeDevice.macAddress);
    return {
      label: storeDevice.clientId,
      value: storeDevice.clientId,
      mac: storeDevice.macAddress, // Make sure MAC is included
      data: storeDevice,
      connectionType: 'api'
    };
  }
  
  console.log('Device not found by name/MAC:', deviceNameOrMac);
  return null;
};

// Subscribe to WebSocket store updates for real-time data
wsStore.$subscribe((mutation, state) => {
  // If we have a fixed device ID (from router), try to find a matching WebSocket client
  if (props.fixedDeviceId) {
    const wsClient = state.clients.find(client => 
      client.clientId === props.fixedDeviceId || client.mac === props.fixedDeviceId
    );
    
    if (wsClient && wsClient.data && wsClient.data.sensors) {
      updateMeasurementsFromWebSocket(wsClient);
      return;
    }
  }
  
  // If we have a device name from URL but no device selected yet, check if it's available now
  if (props.deviceName && !selectedDevice.value && state.clients.length > 0 && props.showDeviceSelector) {
    // Try to find the device by name in the WebSocket clients
    const wsDevice = state.clients.find(client => 
      client.clientId === props.deviceName || client.mac === props.deviceName
    );
    
    if (wsDevice) {
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
      // Check for firmware version even if no sensor data yet
      if (client.swVersion) {
        firmwareVersion.value = client.swVersion;
        lastUpdateTimestamp.value = new Date().toISOString();
      }
      
      // Update sensor data if available
      if (client.data && client.data.sensors) {
        updateMeasurementsFromWebSocket(client);
      }
    }
  }
});

// Debug log for arcSettings
watch(() => arcSettings.value, (newSettings, oldSettings) => {
  console.log('🔥 Arc settings changed:');
  console.log('  New values:', newSettings);
  console.log('  Old values:', oldSettings);
}, { immediate: true, deep: true });

// Watch for changes to the selected device
watch(selectedDevice, (newDevice, oldDevice) => {
  console.log('📱 Selected device changed:', newDevice?.label);
  
  if (newDevice) {
    console.log('Device selected from dropdown:');
    console.log('- Label:', newDevice.label);
    console.log('- Value:', newDevice.value);
    console.log('- MAC Address:', newDevice.mac);
    console.log('- Arc Start:', newDevice.arcStart);
    console.log('- Arc End:', newDevice.arcEnd);
    console.log('- Connection Type:', newDevice.connectionType);
    
    // Only reset values if changing to a completely different device
    if (!oldDevice || newDevice.value !== oldDevice.value) {
      // Always reset firmware version and timestamp when changing devices
      firmwareVersion.value = 'Unknown';
      lastUpdateTimestamp.value = 'Unknown';
      
      // Reset other values
      resetValues();
    }
    
    // Immediately fetch measurements for the new device
    fetchMeasurements();
    
    // DEBUG: Log the arc settings calculation after selection
    console.log('ARC SETTINGS CHECK after selection:');
    const device = newDevice.mac 
      ? devicesStore.getDeviceByMac(newDevice.mac) 
      : devicesStore.getDeviceById(newDevice.value);
    
    if (device) {
      console.log('Found device in store after selection:');
      console.log('- ID:', device.id);
      console.log('- ClientId:', device.clientId);
      console.log('- MAC:', device.macAddress);
      console.log('- Arc Start:', device.arcStart);
      console.log('- Arc End:', device.arcEnd);
    } else {
      console.log('Device not found in store after selection');
    }
  } else {
    // If no device is selected, reset all values
    resetValues();
    firmwareVersion.value = 'Unknown';
    lastUpdateTimestamp.value = 'Unknown';
  }
});

// Also watch fixedDeviceId for changes
watch(() => props.fixedDeviceId, (newId) => {
  if (newId) {
    // Reset values when the fixed device ID changes
    resetValues();
    firmwareVersion.value = 'Unknown';
    lastUpdateTimestamp.value = 'Unknown';
    
    // Fetch measurements for the new device ID
    fetchMeasurements();
  }
}, { immediate: true });

onMounted(() => {
  // If we have a fixed device ID, use it
  if (props.fixedDeviceId) {
    fetchMeasurements();
  }
  // Otherwise, if we have a device name from URL, try to find and select it
  else if (props.deviceName && props.showDeviceSelector) {
    // Wait a bit for WebSocket and stores to initialize
    setTimeout(() => {
      const device = findDeviceByName(props.deviceName);
      if (device) {
        selectedDevice.value = device;
      }
    }, 1000);
  }

  // Set up interval to fetch measurements
  intervalId = setInterval(() => {
    if (props.fixedDeviceId || selectedDevice.value) {
      fetchMeasurements();
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

<style lang="scss" scoped>
.measurements-display {
  width: 100%;
}
</style>