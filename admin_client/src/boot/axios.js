import { boot } from "quasar/wrappers";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
//const api = axios.create({ baseURL: 'http://localhost:3000' })
//const api = axios.create({ baseURL: 'http://wsanemo.kororos.eu' })
console.log(`API_BASE_URL: ${process.env.API_BASE_URL}`);

const api = axios.create({
  baseURL: process.env.API_BASE_URL || "http://localhost:3000",
  withCredentials: true,
});
export default boot(({ app }) => {
  console.log(`API_BASE_URL: ${process.env.API_BASE_URL}`);
  api.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    if (authStore.user) {
      if (authStore.user.access_jwt) {
        config.headers = {
          Authorization : `Bearer ${authStore.user.access_jwt}`,
        };
      }
    }
    return config;
  });

  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api };
