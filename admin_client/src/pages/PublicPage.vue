<template>
  <q-page padding>
    <!-- Use the MeasurementsDisplay component with conditional rendering -->
    <div v-if="deviceName">
      <!-- If device is specified in URL -->
      <MeasurementsDisplay 
        :fixedDeviceId="deviceName"
        :showDeviceSelector="false"
        :showMeasurementsChart="false"
        :authenticated="false"
      />
    </div>
    <div v-else>
      <!-- If no device in URL, show selector -->
      <MeasurementsDisplay 
        :showDeviceSelector="true"
        :showMeasurementsChart="false"
        :authenticated="false"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MeasurementsDisplay from 'src/components/MeasurementsDisplay.vue';
import { useDevicesStore } from 'src/stores/devicesStore';
import { useWebSocketStore } from 'src/stores/webSocketStore';

// Define props
const props = defineProps({
  deviceName: {
    type: String,
    default: '',
    required: false
  }
});

// Access stores
const devicesStore = useDevicesStore();
const webSocketStore = useWebSocketStore();

// Ensure stores are properly initialized
onMounted(async () => {
  console.log('PublicPage - Device from URL:', props.deviceName);
  
  // Make sure WebSocket is initialized
  webSocketStore.initializeWebSocket();
  
  // Make sure devices are loaded
  await devicesStore.fetchDevices();
  console.log('PublicPage - Devices loaded:', devicesStore.devices.length);
  
  // Log any device specified in URL to help with debugging
  if (props.deviceName) {
    // Check if it's a MAC address
    if (props.deviceName.includes(':')) {
      const device = devicesStore.getDeviceByMac(props.deviceName);
      if (device) {
        console.log('Found device by MAC:', props.deviceName);
        console.log('Arc settings:', device.arcStart, device.arcEnd);
      } else {
        console.log('Device not found by MAC:', props.deviceName);
      }
    } else {
      // Try to find by client ID
      const device = devicesStore.getDeviceById(props.deviceName);
      if (device) {
        console.log('Found device by ID:', props.deviceName);
        console.log('Arc settings:', device.arcStart, device.arcEnd);
      } else {
        console.log('Device not found by ID:', props.deviceName);
      }
    }
  }
});
</script>