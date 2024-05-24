import { boot } from "quasar/wrappers";
import { useAuthStore } from "@/stores/authStore";
import { useWebSocketStore } from "@/stores/webSocketStore";


export default boot( async ({ store, urlPath, redirect }) => {
 try {
    console.log('authBoot');
    console.log('VUE_APP_VERSION: ', process.env.VUE_APP_VERSION);
    const authStore = useAuthStore();
    await authStore.refreshToken();

    const webSocketStore = useWebSocketStore();
    webSocketStore.initializeWebSocket();

  } catch (error) {
    // Do not do anything if the refresh token fails.
  }
});
