<template>
    <q-page padding>
        <!-- content -->
        <WindSpeed :speed="speed" />
    </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useWebSocketStore } from "src/stores/webSocketStore";
import WindSpeed from 'src/components/WindSpeed.vue';

const wsStore = useWebSocketStore();

const speed = ref(0);
const props = defineProps({
    uuid: String
});

wsStore.$subscribe((mutation, state) => {
    const client = state.clients.find(client => client.uuid === props.uuid);
    if(!client) speed.value = 0; 
    else if (!client.data) speed.value = 0; 
    else speed.value = client.data.sensors.find(item => item.sensor === 'speed').data.data || 0;
    //const sensor = client.data.sensors.find(sensor => sensor.sensor === 'speed');
    //speed.value = client.data.sensors.find(item => item.sensor === 'speed').data.data || 0;
});
</script>