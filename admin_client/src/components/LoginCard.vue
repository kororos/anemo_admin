<template>
    <q-card class="q-pa-sm shadow-10" :bordered="true" style="max-width: 400px; margin: 0 auto;">
        <q-card-section>
            <div class="text-h6">Anemometer Admin Console</div>
        </q-card-section>
        <q-card-section>
            <q-form @submit="login">
                <q-input v-model="username" label="Username" />
                <q-input v-model="password" label="Password" type="password" />
                <q-btn type="submit" label="Login" color="primary" class="q-mt-md" />
            </q-form>
        </q-card-section>
        <q-card-section>
            <div>
                <a :href="getGoogleUrl(from)"  class="text-center" target="_blank">
                <q-img src="../assets/web_light_rd_ctn.svg" fit="scale-down" /> </a>
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore.js';
import { useRoute, useRouter } from 'vue-router';
import getGoogleUrl from '../utils/getGoogleUrls.js'


const router = useRouter();
const route = useRoute();
const store = useAuthStore();
const username = ref('');
const password = ref('');
const from='/';
function login() {
    store.login(username.value, password.value).then(() => {
        router.push(route.query.returnUrl || '/');
    }).catch(() => {
        console.log('Login failed');
    })
}

</script>