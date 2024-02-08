<template>
  <q-table :rows="firmwareInfo" :columns="columns" row-key="id">
    <template v-slot:body-cell-action="props">
      <q-td :props="props">
        <q-btn @click="performAction(props.row)" label="Delete" />
      </q-td>
    </template>
  </q-table>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../boot/axios.js';

const firmwareInfo = ref([]);
const columns = ref([
  { name: 'HwVersion', required: true, label: 'Hardware Version', align: 'left', field: 'hwVersion', sortable: true },
  { name: 'SwVersion', required: true, label: 'Firmware Version', align: 'left', field: 'swVersion', sortable: true },
  { name: 'action', required: true, label: 'Delete', align: 'left' }
]);

async function populateVersions() {
  try {
    const response = await api.get('/api/getFirmwareInfo');
    for (let key in response.data) {
      response.data[key].forEach(element => {
        firmwareInfo.value.push({ hwVersion: key, swVersion: element });
      });
    }
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  populateVersions();
});

async function performAction(row) {
  // concat the hwVersion and swVersion to get the full version seperated by a slash
  const fullVersion = row.hwVersion + '/' + row.swVersion;

  // Call post api /api/deleteFirmware with the full version as the parameter
  await api.post('/api/deleteFirmware', { version: fullVersion })
    .then(response => {
      console.log(response);
    })
    .catch(error => {
      console.error(error);
    });

    // Refresh the table after the delete operation
    firmwareInfo.value = [];
    populateVersions();

}
</script>
