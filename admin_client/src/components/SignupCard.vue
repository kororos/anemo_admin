<template>
    <q-card class="q-pa-sm shadow-10" :bordered="true" style="max-width: 400px; margin: 0 auto;">
        <q-card-section>
            <div class="text-h6">Anemometer Admin Console</div>
        </q-card-section>
        <q-card-section>
            <q-form @submit="signup">
                <q-input v-model="username" label="Username" />
                <q-input v-model="email" label="Email" />
                <q-input v-model="password" label="Password" type="password" />
                <q-input v-model="passwordRep" label="Confirm Password" type="password" />
                <div class=" flex justify-between">
                    <q-btn type="submit" label="Sign Up" color="primary" class="q-mt-md" />
                    <q-btn label="Login" color="primary" class="q-mt-md" @click="login" />
                </div>
            </q-form>
        </q-card-section>
        <q-card-section>
            <div>
                <a :href="getGoogleUrl(data)" class="text-center" target="_blank">
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
const data = ref({
    baseUrl: location.origin,
    from: route.query.returnUrl || '/'
});

function callGoogle() {
    getGoogleUrl(data.value);
}
//const from= ref(location.origin + route.fullPathroute.query.returnUrl ||  '/');
function signup() {
    store.login(username.value, password.value, route.query.returnUrl).then(() => {
        router.push(route.query.returnUrl || '/');
    }).catch(() => {
        console.log('Login failed');
    })
}

function login() {
    router.push('/login');
}

</script>
