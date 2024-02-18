<template>
    <div :style="{backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' }">
    <q-page class="column justify-center" >
        <login-card></login-card>
    </q-page>
    </div>
</template>


<script setup>
import LoginCard from '../components/LoginCard.vue';
import backgroundImage from '../assets/background-kite.webp';

</script>
