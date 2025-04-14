<template>
    <q-page padding>
        <!-- content -->
        <div class="flex row items-center justify-between">
            <q-card class="col-xs-12 col-sm q-mr-md q-mb-md q-mt-md">
                <q-card-section>
                    <div class="text-center text-h6 text-no-wrap">Wind Direction</div>
                </q-card-section>
                <CompassD3 id="compass" :arrowAngle="direction" :arcStart="180" :arcEnd="270"/>
            </q-card>
            <q-card class="col-xs-12 col-sm q-mr-md q-mb-md q-mt-md">
                <q-card-section>
                    <div class="text-center text-h6 text-no-wrap">Wind Speed</div>
                </q-card-section>
                <GaugeD3 class="justify-center " :value="speed" :valueMax="30" :innerRadius="60" :outerRadius="80"
                    id="speed1" />
            </q-card>
            <q-card class="col-xs-12 col-sm q-mr-md q-mb-md q-mt-md">
                <q-card-section>
                    <div class="text-center text-h6">Temperature</div>
                </q-card-section>
                <GaugeD3 :value="temperature" :valueMax="45" id="temperature" />
            </q-card>
            <q-card class="col-xs-12 col-sm  q-mb-md q-mt-md">
                <q-card-section>
                    <div class="text-center text-h6">Humidity</div>
                </q-card-section>
                <GaugeD3 :value="humidity" :valueMax="100" id="humidity" />
            </q-card>
            <q-card class="col-12 q-mr-md q-mb-md q-mt-md">
                <q-card-section>
                    <div class="text-center text-h6" id="measurements">Measurements</div>
                </q-card-section>
                <MeasurementsD3 id="measurements" :device="props.device"  />
            </q-card>
            <q-card class="col-xs-12 col-sm q-mr-md q-mb-md q-mt-md">
                <VersionCard :fw-version="firmwareVersion" />
            </q-card>
            <q-card class="col-xs-12 col-sm q-mb-md q-mt-md">
                <LastUpdateCard :timestamp="lastUpdateTimestamp" />
            </q-card>
        </div>
    </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { api } from 'src/boot/axios';
import GaugeD3 from 'src/components/GaugeD3.vue';
import CompassD3 from 'src/components/CompassD3.vue';
import MeasurementsD3 from 'src/components/MeasurementsD3.vue';
import VersionCard from 'src/components/VersionCard.vue';
import LastUpdateCard from 'src/components/LastUpdateCard.vue';

const speed = ref(0);
const temperature = ref(0);
const humidity = ref(0);
const direction = ref(0);
const firmwareVersion = ref('Unknown');
const lastUpdateTimestamp = ref('Unknown');
const props = defineProps({
    uuid: String,
    device: String
});

let intervalId = null;

const fetchMeasurements = async () => {
    try {
        const response = await api.get('/api/getMeasurements', {
            params: { deviceId: props.device }
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
            const versionData = data.find(item => item._field =='version');
            if (versionData) {
                firmwareVersion.value = versionData._value;
                lastUpdateTimestamp.value = versionData._time || 'Unknown';
            } else {
                firmwareVersion.value = 'Unknown';
                lastUpdateTimestamp.value = 'Unknown';
            }
        } else {
            // Reset values if no data is available
            speed.value = 0;
            temperature.value = 0;
            humidity.value = 0;
            direction.value = 0;
            firmwareVersion.value = 'Unknown';
            lastUpdateTimestamp.value = 'Unknown';
        }
    } catch (error) {
        console.error('Error fetching measurements:', error);
        
        // Reset values on error
        speed.value = 0;
        temperature.value = 0;
        humidity.value = 0;
        direction.value = 0;
        firmwareVersion.value = 'Unknown';
        lastUpdateTimestamp.value = 'Unknown';
    }
};

onMounted(() => {
    // Fetch measurements immediately
    fetchMeasurements();
    
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