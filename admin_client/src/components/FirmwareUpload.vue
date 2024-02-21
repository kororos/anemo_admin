<template>
  <div class="q-pa-md">
    <q-form @submit.prevent="submitForm" class="q-gutter-md">
      <q-input v-model="hwVersion" id="hwVersion" label="Hardware Version" outlined dense></q-input>
      <q-input v-model="swVersion" id="swVersion" label="Software Version" outlined dense></q-input>
      <q-file dense outlined bottom-slots v-model="path" id="firmwareFile" label="Firmware File" counter>
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

const hwVersion = ref('');
const swVersion = ref('');
const path = ref(null);
const uploadProgress = ref(0);
const emit = defineEmits(['progressUpload', 'uploadFinished']);


function enabled() {
  return hwVersion.value && swVersion.value && path.value;
}
async function submitForm() {
  // Handle form submission here
  const formData = new FormData();
  formData.append('hwVersion', hwVersion.value);
  formData.append('swVersion', swVersion.value);
  formData.append('file', path.value);


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
  })



}
</script>

<style>

</style>
