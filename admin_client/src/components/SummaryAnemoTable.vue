<template>
  <div>
    <q-table
      title="Anemometers"
      :rows="rows"
      :columns="columns"
      row-key="clientId"
    >
      <template v-slot:body-cell-action="props">
        <q-td :props="props">
          <q-btn @click="performAction(props.row)" label="Update" />
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useWebSocketStore } from 'src/stores/webSocketStore';
const store = useWebSocketStore();

const columns = [
  {
    name: 'clientId',
    required: true,
    label: 'Client ID',
    align: 'left',
    field: row => row.clientId,
    format: val => `${val}`,
    sortable: true
  },
  {
    name: 'uuid',
    required: false,
    label: 'UUID',
    align: 'left',
    field: 'uuid'
  },
  {
    name: 'hwVersion',
    required: false,
    label: 'HW Version',
    align: 'left',
    field: 'hwVersion'
  },
  {
    name: 'swVersion',
    required: false,
    label: 'Current SW Version',
    align: 'left',
    field: 'swVersion'
  },
  { name: 'action', required: true,  align: 'left' }
]

const rows = computed(() => store.clients);

function performAction(row) {
      // Perform your specific action here
      console.log(`Performing action on: ${row.uuid}`);
    }
</script>
