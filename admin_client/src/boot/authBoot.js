import { boot } from "quasar/wrappers";
import { useAuthStore } from "@/stores/authStore";


export default boot( async ({ store, urlPath, redirect }) => {
 try {
    console.log('authBoot');
    // const authStore = useAuthStore();
    // await authStore.refreshToken();

    // const publicPages = ["/login"];
    // const authRequired = !publicPages.includes(publicPages);

    // if (authRequired && !authStore.user) {
    //   redirect({
    //     path: "/login",
    //     query: { returnUrl: urlPath },
    //   });
    // }

    router.beforeEach(async (to, from) => {
      const publicPages = ["/login"];
      const authRequired = !publicPages.includes(to.path);
      const authStore = useAuthStore();
      if (authRequired && !authStore.user) {
        return {
          path: "/login",
          query: { returnUrl: to.fullPath },
        };
      }
    });


  } catch (error) {
    // Do not do anything if the refresh token fails.
  }
});
