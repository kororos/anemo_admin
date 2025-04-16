<template>
  <q-card-section>
    <div class="text-center text-h6 row justify-center items-center">
      Last Update: {{ formattedTimestamp }}
      <q-icon 
        v-if="isUnknown" 
        name="error" 
        color="negative" 
        size="sm" 
        class="q-ml-sm"
      >
        <q-tooltip>No data available</q-tooltip>
      </q-icon>
      <q-icon 
        v-else-if="isOld" 
        name="warning" 
        color="warning" 
        size="sm" 
        class="q-ml-sm"
      >
        <q-tooltip>Data is more than 24 hours old</q-tooltip>
      </q-icon>
    </div>
  </q-card-section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  timestamp: {
    type: String,
    default: 'Unknown'
  },
  preformatted: {
    type: Boolean,
    default: false
  },
  deviceSelected: {
    type: Boolean,
    default: false
  }
});

const isUnknown = computed(() => props.timestamp === 'Unknown' && props.deviceSelected);

const isOld = computed(() => {
  if (props.timestamp === 'Unknown' || props.preformatted) return false;
  
  try {
    const date = new Date(props.timestamp);
    const now = new Date();
    const diffMs = now - date;
    const dayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return diffMs > dayMs;
  } catch (error) {
    console.error('Error calculating timestamp age:', error);
    return false;
  }
});

const formattedTimestamp = computed(() => {
  if (props.timestamp === 'Unknown') return 'Unknown';
  if (props.preformatted) return props.timestamp;
  
  try {
    const date = new Date(props.timestamp);
    
    // Format as dd-mm-yyyy hh:mm:ss in local timezone
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Unknown';
  }
});
</script>

<style lang="scss" scoped>
.last-update-card {
  margin-top: 12px;
}
</style>