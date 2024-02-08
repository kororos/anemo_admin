<template>
  <q-table
    :rows="firmwareInfo"
    :columns="columns"
    row-key="id"
  ></q-table>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../boot/axios.js';

const firmwareInfo = ref([]);
const columns = ref([
  { name: 'HwVersion', required: true, label: 'Hardware Version', align: 'left', field: 'hwVersion', sortable: true },
  { name: 'SwVersion', required: true, label: 'Firmware Version', align: 'left', field: 'swVersion', sortable: true }
]);

onMounted(async () => {
  try {
    const response = await api.get('/api/getFirmwareInfo');
    for(let key in response.data) {
      response.data[key].forEach(element => {
        firmwareInfo.value.push({hwVersion: key, swVersion: element});
      });
    }
  } catch (error) {
    console.error(error);
  }
});
</script>
