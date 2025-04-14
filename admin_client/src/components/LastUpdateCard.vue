<template>
  <q-card-section>
    <div class="text-center text-h6">Last Update: {{ formattedTimestamp }}</div>
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