<template>
  <div class="websocket-state-icon">
    <q-icon 
      :name="connectionIcon" 
      :color="connectionColor" 
      :size="size" 
      class="q-mr-xs"
    >
      <q-tooltip>
        {{ connectionTooltip }}
      </q-tooltip>
    </q-icon>
    <span v-if="showText" class="text-caption">{{ connectionText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useWebSocketStore } from 'src/stores/webSocketStore';

const props = defineProps({
  size: {
    type: String,
    default: 'sm'
  },
  showText: {
    type: Boolean,
    default: false
  }
});

const webSocketStore = useWebSocketStore();

const connectionIcon = computed(() => {
  switch (webSocketStore.connectionStatus) {
    case 'connected':
      return 'wifi';
    case 'connecting':
      return 'sync';
    case 'disconnected':
    case 'closing':
    default:
      return 'wifi_off';
  }
});

const connectionColor = computed(() => {
  switch (webSocketStore.connectionStatus) {
    case 'connected':
      return 'positive';
    case 'connecting':
      return 'warning';
    case 'disconnected':
    case 'closing':
    default:
      return 'negative';
  }
});

const connectionText = computed(() => {
  switch (webSocketStore.connectionStatus) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'closing':
      return 'Closing...';
    case 'disconnected':
    default:
      return 'Disconnected';
  }
});

const connectionTooltip = computed(() => {
  const baseTip = connectionText.value;
  const lastMessage = webSocketStore.lastMessageTime 
    ? `Last message: ${new Date(webSocketStore.lastMessageTime).toLocaleTimeString()}` 
    : 'No messages received';
  
  return `${baseTip}\n${lastMessage}`;
});
</script>

<style lang="scss" scoped>
.websocket-state-icon {
  display: inline-flex;
  align-items: center;
}
</style>