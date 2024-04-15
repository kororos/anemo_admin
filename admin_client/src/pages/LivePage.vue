<template>
    <q-page padding>
        <!-- content -->
        <div class="flex row items-center justify-between">

            <q-card class="col-xs-12 col-sm q-mr-md q-mb-md q-mt-md">
                <q-card-section>
                    <div class="text-center text-h6">Wind Speed</div>
                </q-card-section>
                <GaugeD3 class="justify-center " :value="speed" 
                    :valueMax="30" :innerRadius="60" :outerRadius="80"
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
            <div class="row">
                <WindSpeedGauge :speed="speed" />
                <TempGauge :temperature="temperature" />
                <HumidityGauge :humidity="humidity" />
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useWebSocketStore } from "src/stores/webSocketStore";
import WindSpeedGauge from 'src/components/WindSpeedGauge.vue';
import TempGauge from 'src/components/TempGauge.vue';
import HumidityGauge from 'src/components/HumidityGauge.vue';
import GaugeD3 from 'src/components/GaugeD3.vue';

const wsStore = useWebSocketStore();

const speed = ref(0);
const temperature = ref(0);
const humidity = ref(0);
const props = defineProps({
    uuid: String
});

wsStore.$subscribe((mutation, state) => {
    const client = state.clients.find(client => client.uuid === props.uuid);
    if (!client) {
        speed.value = 0;
        temperature.value = 0;
        humidity.value = 0;
    } else if (!client.data) {
        speed.value = 0;
        temperature.value = 0;
        humidity.value = 0;
    } else {
        //Speed is in m/s, convert to knots
        //speed.value = client.data.sensors.find(item => item.sensor === 'speed').data.data * 1.94 || 0;
        speed.value = client.data.sensors.find(item => item.sensor === 'speed').data.rotPerSec * 1.46 || 0;
        if (speed.value >= 1) speed.value = speed.value + 1;
        temperature.value = client.data.sensors.find(item => item.sensor === 'temperature').data || 0;
        humidity.value = client.data.sensors.find(item => item.sensor === 'humidity').data || 0;
    }
    //const sensor = client.data.sensors.find(sensor => sensor.sensor === 'speed');
    //speed.value = client.data.sensors.find(item => item.sensor === 'speed').data.data || 0;
});
</script>