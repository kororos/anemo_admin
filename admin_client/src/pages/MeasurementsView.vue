<template>
    <q-page padding>
        <!-- Use the MeasurementsDisplay component -->
        <MeasurementsDisplay 
            :fixedDeviceId="device" 
            :showDeviceSelector="false"
            :showMeasurementsChart="true"
            :authenticated="true"
        />
    </q-page>
</template>

<script setup>
import { defineProps } from 'vue';
import MeasurementsDisplay from 'src/components/MeasurementsDisplay.vue';

const props = defineProps({
    uuid: String,
    device: String
});
</script>