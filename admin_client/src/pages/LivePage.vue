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
            <q-card class="col-xs-12 col-sm q-mr-md q-mb-md q-mt-md">
                <q-card-section>
                    <div class="text-center text-h6">Humidity</div>
                </q-card-section>
                <GaugeD3 :value="humidity" :valueMax="100" id="humidity" />
            </q-card>
            <q-card class="col-12 q-mr-md q-mb-md q-mt-md">
                <q-card-section>
                    <div class="text-center text-h6">Measurements</div>
                </q-card-section>
                <MeasurementsD3 id="measurements" />
            </q-card>
        </div>
    </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useWebSocketStore } from "src/stores/webSocketStore";
import GaugeD3 from 'src/components/GaugeD3.vue';
import CompassD3 from 'src/components/CompassD3.vue';
import MeasurementsD3 from 'src/components/MeasurementsD3.vue';

const wsStore = useWebSocketStore();

const speed = ref(0);
const temperature = ref(0);
const humidity = ref(0);
const direction = ref(0);
const props = defineProps({
    uuid: String
});

wsStore.$subscribe((mutation, state) => {
    const client = state.clients.find(client => client.uuid === props.uuid);
    if (!client) {
        speed.value = 0;
        temperature.value = 0;
        humidity.value = 0;
        direction.value = 0;
    } else if (!client.data) {
        speed.value = 0;
        temperature.value = 0;
        humidity.value = 0;
        direction.value = 0;
    } else {
        //Speed is in m/s, convert to knots
        //speed.value = client.data.sensors.find(item => item.sensor === 'speed').data.data * 1.94 || 0;
        speed.value = client.data.sensors.find(item => item.sensor === 'speed').data.rotPerSec * 1.46 || 0;
        if (speed.value >= 1) speed.value = speed.value + 1;
        direction.value = client.data.sensors.find(item => item.sensor === 'magneto').data || 0;
        temperature.value = client.data.sensors.find(item => item.sensor === 'temperature').data || 0;
        humidity.value = client.data.sensors.find(item => item.sensor === 'humidity').data || 0;
    }
    //const sensor = client.data.sensors.find(sensor => sensor.sensor === 'speed');
    //speed.value = client.data.sensors.find(item => item.sensor === 'speed').data.data || 0;
});
</script>