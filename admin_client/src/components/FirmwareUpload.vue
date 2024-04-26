<template>
  <div class="q-pa-md">
    <q-form @submit.prevent="submitForm" class="q-gutter-md">
      <q-input v-model="hwVersion" id="hwVersion" label="Hardware Version" outlined dense></q-input>
      <q-input v-model="swVersion" id="swVersion" label="Software Version" outlined dense></q-input>
      <q-file dense outlined bottom-slots @update:model-value="fileSelected" v-model="path" id="firmwareFile" label="Firmware File" counter>
        <template v-slot:prepend>
          <q-icon name="cloud_upload" @click.stop.prevent />
        </template>
        <template v-slot:append>
          <q-icon name="close" @click.stop.prevent="path = null" class="cursor-pointer" />
        </template>

        <template v-slot:hint>
          Firmware file to upload
        </template>
      </q-file>
      <q-btn type="submit" label="Submit" color="primary" :disable="!enabled()"></q-btn>
    </q-form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { api } from '../boot/axios.js';
import { useQuasar } from 'quasar';
import { isBrowser, isNode } from 'browser-or-node';
import * as zip from "@zip.js/zip.js";

const $q = useQuasar();
const hwVersion = ref('');
const swVersion = ref('');
const path = ref(null);
const uploadProgress = ref(0);
const emit = defineEmits(['progressUpload', 'uploadFinished', 'uploadError']);

function fileSelected(file) {
  console.log("File selected: ",file);
  console.log(isBrowser? "Browser" : "Node");
  const zipFile = new zip.ZipReader(new zip.BlobReader(file));
  zipFile.getEntries().then((entries) => {
    console.log(entries);
    // If the filename is descriptor.txt read the file and parse the contents
    entries.forEach(async (entry) => {
      if (entry.filename === 'descriptor.txt') {
        const text = await entry.getData(new zip.TextWriter());
        // Split the text by new line. For each line read the key value pair
        const lines = text.split('\n');
        for (const line of lines) {
          const [key, value] = line.split('=');
          if (key === 'hwVersion') {
            hwVersion.value = value;
          } else if (key === 'swVersion') {
            swVersion.value = value;
          }
        }
      }
    });

  });
}

function enabled() {
  return hwVersion.value && swVersion.value && path.value;
}
async function submitForm() {
  // Handle form submission here
  const formData = new FormData();
  formData.append('hwVersion', hwVersion.value);
  formData.append('swVersion', swVersion.value);
  //formData.append('file', path.value);

  // Unzip the file and read the firmware.bin file. Send this file to the api/formwareUpload endpoint
  const zipFile = await new zip.ZipReader(new zip.BlobReader(path.value));
  const entries = await zipFile.getEntries();
  for (const entry of entries) {
    if (entry.filename === 'firmware.bin') {
      const fileData = await entry.getData(new zip.BlobWriter());
      formData.append('file', fileData, 'firmware.bin');
      break;
    }
  }
  await zipFile.close();
  const response = await api.post('/api/firmwareUpload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      emit('progressUpload', uploadProgress.value);

    }
  }).then((response) => {
    console.log(response);
    emit('uploadFinished');
    uploadProgress.value = 0;
    emit('progressUpload', uploadProgress.value);
    hwVersion.value = '';
    swVersion.value = '';
    path.value = null;

  }).catch((error) => {
    console.error(error);
    emit('uploadError');
  })



}
</script>

<style>

</style>
