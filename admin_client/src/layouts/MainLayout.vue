<template>
  <q-layout view="lHh Lpr lFf" :class="{ 'bg-grey-9': $q.dark.isActive }">
    <q-header elevated :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          Anemometer
        </q-toolbar-title>
        <div>
          <web-socket-state-icon class="q-pr-md" size="md" show-text />
        </div>
        <div>Quasar v{{ $q.version }}</div>
        
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
        
        <div><q-btn flat round dense icon="logout" aria-label="Logout" @click="authStore.logout()" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-toolbar class="menu-title">
        <q-toolbar-title>
          Menu
        </q-toolbar-title>
      </q-toolbar>
      <q-list>
        <EssentialLink v-for="link in menuLinksList" active-class="active-item" :key="link.title" v-bind="link" />
        <q-separator />
        <q-item-label header>
          Essential Links
        </q-item-label>

        <EssentialLink v-for="link in essentialLinks" :key="link.title" v-bind="link" />
      </q-list>
      <q-separator />
      <q-item-label header>
        Version: {{ packageVersion }}
      </q-item-label>
    </q-drawer>

    <q-page-container class="test">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar'

import EssentialLink from 'components/EssentialLink.vue';
import { useWebSocketStore } from '../stores/webSocketStore.js';
import WebSocketStateIcon from 'src/components/WebSocketStateIcon.vue';
import { useAuthStore } from '@/stores/authStore';
import { version as packageVersion } from '../../package.json';
const menuLinksList = [
  {
    title: 'Dashboard',
    caption: 'View all devices',
    icon: 'home',
    page: '/',
  },
  {
    title: 'Devices',
    caption: 'View all devices',
    icon: 'air',
    page: '/devices',
  },
  {
    title: 'Upload Firmware',
    caption: 'Upload new firmware',
    icon: 'cloud_upload',
    page: '/uploadFirmware',
  }
]
const linksList = [
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: 'https://quasar.dev'
  },
  {
    title: 'Github',
    caption: 'github.com/quasarframework',
    icon: 'code',
    link: 'https://github.com/quasarframework'
  },
  {
    title: 'Discord Chat Channel',
    caption: 'chat.quasar.dev',
    icon: 'chat',
    link: 'https://chat.quasar.dev'
  },
  {
    title: 'Forum',
    caption: 'forum.quasar.dev',
    icon: 'record_voice_over',
    link: 'https://forum.quasar.dev'
  },
  {
    title: 'Twitter',
    caption: '@quasarframework',
    icon: 'rss_feed',
    link: 'https://twitter.quasar.dev'
  },
  {
    title: 'Facebook',
    caption: '@QuasarFramework',
    icon: 'public',
    link: 'https://facebook.quasar.dev'
  },
  {
    title: 'Quasar Awesome',
    caption: 'Community Quasar projects',
    icon: 'favorite',
    link: 'https://awesome.quasar.dev'
  }
]
const leftDrawerOpen = ref(false)
const essentialLinks = ref(linksList);
const darkMode = ref(false);
const $q = useQuasar();
const authStore = useAuthStore();
// Function to toggle dark mode
const toggleDarkMode = (value) => {
  $q.dark.set(value);
  // Store preference in localStorage
  localStorage.setItem('darkMode', value.toString());
};

// Initialize dark mode on component mount
onMounted(() => {
  // Initialize dark mode from localStorage
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode !== null) {
    const isDarkMode = savedDarkMode === 'true';
    darkMode.value = isDarkMode;
    $q.dark.set(isDarkMode);
  } else {
    // Check for system preference if no saved preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    darkMode.value = prefersDark;
    $q.dark.set(prefersDark);
  }
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

</script>

<style lang="scss" scoped>
body.body--dark {
  .test {
    //background-color: $blue-grey-10;
    background-color: $dark-page;
  }

  .menu-title {
    background-color: $grey-10;
  }

  .q-header {
    background-color: $grey-10;
  }

}

.menu-title {
  background-color: $indigo-5;
  color: white;
}

.test {
  background-color: $grey-2;
}
</style>
