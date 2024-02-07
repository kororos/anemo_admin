<template>
  <q-icon :name="iconName()" :color="iconName() === 'check_circle' ? 'green' : 'red'" />
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
