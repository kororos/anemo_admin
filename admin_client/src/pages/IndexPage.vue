<template>
  <div class="flex row justify-center">
    <q-page class="column justify-center ">
      <summary-anemo-table class="q-ma-md" > </summary-anemo-table>
      <div class="row  justify-between q-ma-md">
        <firmware-info-table ref = "firmwareInfoTable" class="q-mr-md col" style="min-width: 800px;"></firmware-info-table>
        <q-card class="q-ml-md col" style="min-width: 400px; max-width: 400px;">
          <q-card-section>
            <q-linear-progress :value="progress" :color="progressColor" animation-speed="100" />
          </q-card-section>
          <q-card-section>
            <firmware-upload @upload-finished="uploadFinished" @progress-upload="updateProgress"> </firmware-upload>
          </q-card-section>
        </q-card>
      </div>

    </q-page>
  </div>
</template>

<script setup >
import { ref } from 'vue';
import SummaryAnemoTable from '../components/SummaryAnemoTable.vue'
import FirmwareInfoTable from '../components/FirmwareInfoTable.vue'
import FirmwareUpload from 'src/components/FirmwareUpload.vue';

const progressColor = "primary"
const progress = ref(0);
const firmwareInfoTable = ref(null);


function updateProgress(value) {
  progress.value = value/100;

}

function uploadFinished() {
  progress.value = 0;
  firmwareInfoTable.value.populateVersions();
}

</script>
<style scoped>
.body--dark{
  background-color: aqua;
  color: white;
}
</style>
