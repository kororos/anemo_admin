<template>
  <q-layout view="lHh Lpr lFf" :class="{ 'bg-grey-9': $q.dark.isActive }">
    <q-header :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold">
          Anemometer
        </q-toolbar-title>
        
        <q-space />

        <!-- Dark mode toggle switch -->
        <q-toggle
          v-model="darkMode"
          :color="darkMode ? 'deep-orange' : 'yellow'" 
          :icon="darkMode ? 'light_mode' : 'dark_mode'"
          :icon-color="darkMode ? 'white' : 'black'"
          @update:model-value="toggleDarkMode"
        >
          <q-tooltip>Toggle Dark Mode</q-tooltip>
        </q-toggle>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { Dark } from 'quasar';
import { useDevicesStore } from 'src/stores/devicesStore';
import { useWebSocketStore } from 'src/stores/webSocketStore';

const $q = useQuasar();
const darkMode = ref(false);

// Function to toggle dark mode
const toggleDarkMode = (value) => {
  Dark.set(value);
  // Store preference in localStorage
  localStorage.setItem('darkMode', value.toString());
};

// Get store references
const devicesStore = useDevicesStore();
const webSocketStore = useWebSocketStore();

// Initialize dark mode and stores on component mount
onMounted(async () => {
  // Initialize dark mode
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    const isDarkMode = savedDarkMode === 'true';
    darkMode.value = isDarkMode;
    Dark.set(isDarkMode);
  } else {
    // Check for system preference if no saved preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    darkMode.value = prefersDark;
    Dark.set(prefersDark);
  }
  
  // Initialize WebSocket
  webSocketStore.initializeWebSocket();
  
  // Initialize devices data
  if (devicesStore.devices.length === 0) {
    await devicesStore.fetchDevices();
  }
});
</script>

<style lang="scss">
/* Additional styles for dark mode if needed */
.body--dark {
  .q-card {
    background-color: #1d1d1d;
  }
  
  .text-h6 {
    color: white;
  }
}
</style>