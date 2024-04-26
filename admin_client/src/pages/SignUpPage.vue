<template>
    <div :style="{backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' }">
    <q-page class="column justify-center" >
        <Signup-card></Signup-card>
    </q-page>
    </div>
</template>


<script setup>
import SignupCard from '../components/SignupCard.vue';
import backgroundImage from '../assets/background-kite.webp';

</script>
