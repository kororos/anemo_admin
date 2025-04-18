<template>
  <q-page padding>
    <!-- content -->
    <div class="flex row items-center justify-between">
      <q-card class="col-xs-12 col-sm q-mr-md q-mb-md q-mt-md">
        <q-card-section>
          <div class="text-center text-h6 text-no-wrap">Wind Direction</div>
        </q-card-section>
        <CompassD3 id="compass" :arrowAngle="direction" :arcStart="arcSettings.arcStart" :arcEnd="arcSettings.arcEnd"/>
      </q-card>
      <q-card class="col-xs-12 col-sm q-mr-md q-mb-md q-mt-md">
        <q-card-section>
          <div class="text-center text-h6 text-no-wrap">Wind Speed</div>
        </q-card-section>
        <GaugeD3 class="justify-center" :value="speed" :valueMax="30" :innerRadius="60" :outerRadius="80"
          id="speed1" />
      </q-card>
      <q-card class="col-xs-12 col-sm q-mr-md q-mb-md q-mt-md">
        <q-card-section>
          <div class="text-center text-h6">Temperature</div>
        </q-card-section>
        <GaugeD3 :value="temperature" :valueMax="45" id="temperature" />
      </q-card>
      <q-card class="col-xs-12 col-sm q-mb-md q-mt-md">
        <q-card-section>
          <div class="text-center text-h6">Humidity</div>
        </q-card-section>
        <GaugeD3 :value="humidity" :valueMax="100" id="humidity" />
      </q-card>
      <q-card class="col-12 q-mr-md q-mb-md q-mt-md">
        <q-card-section>
          <div class="text-center text-h6" id="measurements">Measurements</div>
        </q-card-section>
        <MeasurementsD3 id="measurements" :device="props.device" />
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useWebSocketStore } from "src/stores/webSocketStore";
import { useDevicesStore } from "src/stores/devicesStore";
import GaugeD3 from 'src/components/GaugeD3.vue';
import CompassD3 from 'src/components/CompassD3.vue';
import MeasurementsD3 from 'src/components/MeasurementsD3.vue';

const wsStore = useWebSocketStore();
const devicesStore = useDevicesStore();

const speed = ref(0);
const temperature = ref(0);
const humidity = ref(0);
const direction = ref(0);

const props = defineProps({
  uuid: String,
  device: String
});

// Get arc settings from the DevicesStore
const arcSettings = computed(() => {
  if (!props.device) {
    return { arcStart: 0, arcEnd: 180 };
  }
  
  // Try to find the client by uuid to get MAC address
  const client = wsStore.clients.find(client => client.uuid === props.uuid);
  
  // If we have a client with MAC address, use it for lookup
  if (client?.mac) {
    return devicesStore.getArcSettings(client.mac);
  }
  
  // Otherwise fall back to device ID
  return devicesStore.getArcSettings(props.device);
});

// Monitor WebSocket store for real-time updates
wsStore.$subscribe((mutation, state) => {
  const client = state.clients.find(client => client.uuid === props.uuid);
  if (!client || !client.data) {
    speed.value = 0;
    temperature.value = 0;
    humidity.value = 0;
    direction.value = 0;
  } else {
    // Speed is in m/s, convert to knots
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
  }
});
</script>