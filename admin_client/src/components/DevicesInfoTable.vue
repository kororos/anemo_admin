<template>
  <q-table :rows="rows" :columns="columns" row-key="macAddress">
    <template v-slot:body-cell-status="props">
      <q-td :props="props">
        <q-chip :label="props.row.status" outline :color="props.row.status === 'Online' ? 'positive' : 'negative'" text-color="white" />
      </q-td>
    </template>
  </q-table>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useWebSocketStore } from "src/stores/webSocketStore";
import { api } from 'src/boot/axios';
const store = useWebSocketStore();
const emit = defineEmits(['apiFail', 'apiSuccess']);

const rows = ref([]);
const columns = [
  {
    name: "clientId",
    required: true,
    label: "Client ID",
    align: "left",
    field: "clientId",
    sortable: true,
  },
  {
    name: "macAddress",
    required: true,
    label: "MAC Address",
    align: "left",
    field: "macAddress",
    sortable: true,
  },

  {
    name: "hwVersion",
    required: true,
    label: "Hardware Version",
    align: "left",
    field: "hwVersion",
    sortable: true,
  },
  {
    name: "fwVersion",
    required: true,
    label: "Firmware Version",
    align: "left",
    field: "fwVersion",
    sortable: true,
  },
  {
    name: "lastConnection",
    required: true,
    label: "Last Seen",
    align: "left",
    field: "lastConnection",
    sortable: true,
  },
  {
    name: "status",
    label: "Status",
    field: "status",
    required: true,
    align: "left",
  },
];
onMounted(async () => {
  await populateDevices();
  checkDeviceStatus();
});
// Call api /api/getKnownDevices to get the list of devices
// and populate the rows
const populateDevices = async () => {
  try {
    const response = await api.get('/api/getKnownDevices');
    rows.value = response.data;
    emit('apiSuccess');
  } catch (error) {
    console.error(error);
    emit('apiFail', error);
  }
}

// For each device, check if the device is online by checking the clients array in the store
// If the device is in the clients array of the store, set the status to "Online"
// If the device is not in the clients array of the store, set the status to "Offline"
const checkDeviceStatus = async () => {
  rows.value.forEach((device) => {
    if (store.clients.find((client) => client.mac === device.macAddress)) {
      device.status = "Online";
    } else {
      device.status = "Offline";
    }
  });
}
</script>
