<template>
    <q-page padding>
        <!-- Use the MeasurementsDisplay component -->
        <MeasurementsDisplay 
            :deviceName="deviceName" 
            :showDeviceSelector="true"
            :showMeasurementsChart="false"
            :authenticated="false"
        />
    </q-page>
</template>

<script setup>
import { defineProps } from 'vue';
import MeasurementsDisplay from 'src/components/MeasurementsDisplay.vue';

// Define props
const props = defineProps({
  deviceName: {
    type: String,
    default: '',
    required: false
  }
});
</script>