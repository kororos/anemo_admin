/**
 * @fileoverview This file contains the implementation of the authStore module.
 * The authStore module is responsible for managing the user authentication state.
 * It provides functions for logging in, refreshing access tokens, and tracking the current user.
 * The module is implemented using the Pinia store pattern.
 */

import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from '../boot/axios.js';
import { useRouter } from 'vue-router';
/**
 * The authStore module.
 */
export const useAuthStore = defineStore("authStore", () => {
    const user = ref(null);
    let refreshTokenTimeout = 0;
    /**
     * Logs in the user with the provided username and password.
     * @param {string} username - The username.
     * @param {string} password - The password.
     */
    async function login(username, password) {
        const response = await api.post('/login', { username, password }, {withCredentials: true});
        user.value = response.data;
        //user.value.jwt = response.headers['authorization'];
        console.log(`user: ${user.value}`);
        startAccessTokenRefresh(getTimeToRefresh(response));
    }

    /**
     * Starts the access token refresh process.
     * @param {number} timeToRefresh - The time in milliseconds until the access token needs to be refreshed.
     */
    function startAccessTokenRefresh(timeToRefresh) {
        if(timeToRefresh > 0){
            refreshTokenTimeout = setTimeout(refreshToken, timeToRefresh );
        }
    }

    /**
     * Refreshes the access token.
     */
    async function refreshToken() {
        const response = await api.post('/refresh', {} ,{withCredentials: true , headers: {Authorization: `Bearer ` + user.value.access_jwt}});
        user.value = response.data;
        console.log(`user: ${user.value}`);
        startAccessTokenRefresh(getTimeToRefresh(response));
    }

    /**
     * Calculates the time in milliseconds until the access token needs to be refreshed.
     * @param {object} response - The response object from the server.
     * @returns {number} The time in milliseconds until the access token needs to be refreshed.
     */
    function getTimeToRefresh(response){
        const authHeader = response.headers['authorization'];
        if(authHeader && authHeader.startsWith('Bearer ')) {
            const accessToken = authHeader.split(' ')[1];
            user.value.access_jwt = accessToken;
            const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            const accessTokenExpiryTime = decodedToken.exp;
            const timeToRefresh = (accessTokenExpiryTime - currentTime - 60) * 1000;
            console.log(`timeToRefresh: ${timeToRefresh}`);
            return timeToRefresh;
        }else{
            return 0;
        }
    }

    async function logout(){
        await api.post('/logout', {}, {withCredentials: true});
        clearTimeout(refreshTokenTimeout);
        user.value = null;

        this.router.push('/login');
    }
    return {
        user,
        login,
        logout,
        refreshToken
    };
});
