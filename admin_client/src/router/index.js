import { route } from "quasar/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";
import { useAuthStore } from "@/stores/authStore";

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
    ? createWebHistory
    : createWebHashHistory;

  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  router.beforeEach((to, from) => {
    if (to.path === "/login_successful") {
      const authStore = useAuthStore();
      let data;
      if (to.query.data) {
        data = JSON.parse(to.query.data);
        authStore.user = {
          username: data.username,
          access_jwt: data.accessToken,
        };
        return { path: data.redirectUrl };
      }

      //authStore.user = true;
      return {
        path: "/",
      };
    } else {
      const publicPages = ["/login"];
      const authRequired = !publicPages.includes(to.path);
      const authStore = useAuthStore();
      //authStore.user.access_jwt = cookies.get("access_jwt");
      if (authRequired && !authStore.user) {
        return {
          path: "/login",
          query: { returnUrl: to.fullPath },
        };
      }
    }
  });

  return router;
});
