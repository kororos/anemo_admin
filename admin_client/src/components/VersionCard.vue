<template>
  <q-card-section>
    <div class="text-center text-h6">Firmware Version: {{ fwVersion }}</div>
  </q-card-section>
</template>

<script setup>
defineProps({
  fwVersion: {
    type: String,
    default: 'Unknown'
  }
});
</script>

<style lang="scss" scoped>
.version-card {
  margin-top: 12px;
}
</style>