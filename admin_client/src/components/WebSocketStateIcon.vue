<template>
  <div>
  <q-icon :name="iconName()" :color="iconName() === 'check_circle' ? 'green' : 'red'" >
    <template v-slot:default>
      <q-tooltip content="WebSocket State" anchor="bottom middle">
        {{ store.adminSocketReadyState === 1 ? "Connected" : "Disconnected" }}
      </q-tooltip>
      </template>
  </q-icon>
</div>
</template>

<script setup>
import { useWebSocketStore } from 'src/stores/webSocketStore';

const store = useWebSocketStore();

function iconName(){
  if (store.adminSocketReadyState === 1) {
    return 'check_circle';
  } else {
    return 'error';
  }
}
</script>
