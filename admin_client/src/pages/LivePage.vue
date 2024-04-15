<template>
    <q-page padding>
        <!-- content -->
        <WindSpeedD3 :speed="speed" :speedMax="20"/>
        <WindSpeedGauge :speed="speed"/>
        <TempGauge :temperature="temperature" />
        <HumidityGauge :humidity="humidity" />
    </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useWebSocketStore } from "src/stores/webSocketStore";
import WindSpeedGauge from 'src/components/WindSpeedGauge.vue';
import TempGauge from 'src/components/TempGauge.vue';
import HumidityGauge from 'src/components/HumidityGauge.vue';
import WindSpeedD3 from 'src/components/WindSpeedD3.vue';

const wsStore = useWebSocketStore();

const speed = ref(0);
const temperature = ref(0);
const humidity = ref(0);
const props = defineProps({
    uuid: String
});

wsStore.$subscribe((mutation, state) => {
    const client = state.clients.find(client => client.uuid === props.uuid);
    if(!client) {
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