<template>
  <div class="flex row justify-center">
  <q-page class="column justify-center " >
    <summary-anemo-table class="q-ma-md"> </summary-anemo-table>
    <div  class="row  justify-between q-ma-md">
      <firmware-info-table class="q-mr-md col-auto"></firmware-info-table>
      <q-card class="q-ml-md col-auto">
        <firmware-upload> </firmware-upload>
      </q-card>
    </div>

  </q-page>
  </div>
</template>

<script setup >
import  SummaryAnemoTable  from '../components/SummaryAnemoTable.vue'
import  FirmwareInfoTable  from '../components/FirmwareInfoTable.vue'
import FirmwareUpload from 'src/components/FirmwareUpload.vue';
</script>
