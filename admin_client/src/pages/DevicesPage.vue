<template>
  <q-page padding>
    <!-- content -->
    <DevicesInfoTable @device-selected="handleDeviceSelected" />
  </q-page>
</template>

<script setup>
import DevicesInfoTable from 'src/components/DevicesInfoTable.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const handleDeviceSelected = (deviceId) => {
  router.push({ 
    name: 'measurements',
    query: { device: deviceId }
  });
};
</script>
