<template>
  <q-page>
    <div class="row">
      <summary-anemo-table class="q-ma-md col" @restart-success="onRestartSuccess" @restart-fail="onRestartFail"
        @row-clicked="onRowClicked">
      </summary-anemo-table>
    </div>
    <div class="q-ma-md">
      <div class="row justify-between q-gutter-md ">
        <!-- <firmware-info-table ref="firmwareInfoTable" class="q-mb-md-none q-mb-sm-md q-mr-sm-md col-md-auto col-sm-12" -->
        <firmware-info-table ref="firmwareInfoTable" class="col-md-grow col-xs-12"
          @delete-successful="onDeleteSuccessful" @delete-failed="onDeleteFailed"></firmware-info-table>
        <!-- <q-card class="q-ml-md-md q-ml-sm-none col-sm-12 col-md-grow"> -->
        <q-card class="col-xs-12 col-md-grow">
          <q-card-section>
            <q-linear-progress :value="progress" :color="progressColor" animation-speed="100" />
          </q-card-section>
          <q-card-section>
            <firmware-upload @upload-finished="uploadFinished" @progress-upload="updateProgress"
              @upload-error="uploadError"> </firmware-upload>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import SummaryAnemoTable from '../components/SummaryAnemoTable.vue'
import FirmwareInfoTable from '../components/FirmwareInfoTable.vue'
import FirmwareUpload from 'src/components/FirmwareUpload.vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const progressColor = "primary"
const progress = ref(0);
const firmwareInfoTable = ref(null);
const router = useRouter();

function updateProgress(value) {
  progress.value = value / 100;

}

function uploadFinished() {
  progress.value = 0;
  $q.notify({
    message: 'Firmware uploaded successfully',
    type: 'positive',
    position: 'top'
  });
  firmwareInfoTable.value.populateVersions();
}

function onDeleteSuccessful() {
  $q.notify({
    message: 'Firmware deleted successfully',
    type: 'positive',
    position: 'top'
  });
}

function onDeleteFailed() {
  $q.notify({
    message: 'Firmware delete failed',
    type: 'negative',
    position: 'top'
  });
}

function uploadError() {
  $q.notify({
    message: 'Firmware upload failed',
    type: 'negative',
    position: 'top'
  });
}

function onRestartSuccess() {
  $q.notify({
    message: 'Restart successful',
    type: 'positive',
    position: 'top'
  })
}

function onRestartFail() {
  $q.notify({
    message: 'Restart failed',
    type: 'negative',
    position: 'top'
  })
}

function onRowClicked(row) {
  console.log(row);
  router.push({ name: `live`, query: { uuid: row.uuid, device: row.clientId } });
}

</script>
<style scoped></style>
