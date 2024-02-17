import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGlobalStore = defineStore('global', () =>{
  const formSubmitted = ref(false);
  function firmwareUploaded() {
    this.formSubmitted = true;
  }

  function resetFormSubmission() {
    this.formSubmitted = false;
  }

  return {
    formSubmitted,
    firmwareUploaded,
    resetFormSubmission
  }
});


