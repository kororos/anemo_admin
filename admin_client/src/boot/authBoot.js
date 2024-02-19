import { boot } from "quasar/wrappers";
import { useAuthStore } from "@/stores/authStore";


export default boot( async ({ store, urlPath, redirect }) => {
 try {
    console.log('authBoot');
    const authStore = useAuthStore();
    await authStore.refreshToken();


  } catch (error) {
    // Do not do anything if the refresh token fails.
  }
});
