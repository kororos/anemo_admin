import { boot } from "quasar/wrappers";
import { useDevicesStore } from "@/stores/devicesStore";

export default boot(async ({ store }) => {
  try {
    console.log('devicesBoot');
    const devicesStore = useDevicesStore();
    
    // Initialize devices store (fetches devices and sets up WebSocket listeners)
    await devicesStore.initialize();
  } catch (error) {
    console.error('Error initializing devices store:', error);
  }
});