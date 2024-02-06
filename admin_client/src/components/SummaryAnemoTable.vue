<template>
  <div class="q-pa-md">
    <q-table
      title="Anemometers"
      :rows="rows"
      :columns="columns"
      row-key="clientId"
    />
  </div>
</template>

<script setup>
import { ref , reactive} from 'vue';
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
  }
]

const rows = ref(store.clients);
store.$subscribe((mutation, state) => {
  rows.value = state.clients;
});
</script>
