import { boot } from "quasar/wrappers";
import { useWebSocketStore } from "@/stores/webSocketStore";
import { useDevicesStore } from "@/stores/devicesStore";

export default boot(async ({ store }) => {
  try {
    console.log('publicBoot');
    
    // Initialize WebSocket store
    const webSocketStore = useWebSocketStore();
    webSocketStore.initializeWebSocket();
    
    // Initialize devices store
    const devicesStore = useDevicesStore();
    await devicesStore.initialize();
  } catch (error) {
    console.error('Error initializing stores for public layout:', error);
  }
});