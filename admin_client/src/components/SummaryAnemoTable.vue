<template>
  <div>
    <q-table
      title="Anemometers"
      :rows="rows"
      :columns="columns"
      row-key="clientId"
      @row-click="onRowClicked"
    >
      <template v-slot:body-cell-action="props">
        <q-td :props="props">
          <q-btn @click="performAction(props.row)" color="warning" label="Update" />
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useWebSocketStore } from "src/stores/webSocketStore";
import { api } from '../boot/axios.js';

const store = useWebSocketStore();
const emit = defineEmits(['restartSuccess', 'restartFail', 'rowClicked']);

const columns = [
  {
    name: "clientId",
    required: true,
    label: "Client ID",
    align: "left",
    field: (row) => row.clientId,
    format: (val) => `${val}`,
    sortable: true,
  },
  {
    name: "uuid",
    required: false,
    label: "UUID",
    align: "left",
    field: "uuid",
  },
  {
    name: "mac",
    required: false,
    label: "MAC",
    align: "left",
    field: "mac",
  },
  {
    name: "hwVersion",
    required: false,
    label: "HW Version",
    align: "left",
    field: "hwVersion",
  },
  {
    name: "swVersion",
    required: false,
    label: "Current SW Version",
    align: "left",
    field: "swVersion",
  },
  { name: "action", required: true, align: "left" },
];

const rows = computed(() => store.clients);

function performAction(row) {
  // Perform your specific action here
  console.log(`Performing action on: ${row.uuid}`);
  restartClient(row);
}

function onRowClicked(evt, row, index) {
  console.log(`Row clicked: ${row.uuid}`);
  emit('rowClicked', row);
}

function restartClient(row) {
  // Call post api /api/deleteFirmware with the full version as the parameter
  api.post('/api/restart', { mac: row.mac, uuid: row.uuid, currentFwVersion: row.swVersion, currentHwVersion: row.hwVersion })
    .then(response => {
      emit('restartSuccess')
      console.log(response);
    })
    .catch(error => {
      emit('restartFail');
      console.error(error);
    });
}
</script>
