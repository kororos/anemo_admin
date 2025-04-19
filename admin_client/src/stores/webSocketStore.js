import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useDevicesStore } from "./devicesStore";

export const useWebSocketStore = defineStore("webSocket", () => {
  const clients = ref([]);
  const socket = ref(null);
  const reconnectInterval = 5000;
  const adminSocketReadyState = ref(0);
  const lastMessageTime = ref(null);

  function initializeWebSocket() {
    const url = process.env.WS_BASE_URL || "ws://localhost:3000/ws/admin";
    const suffix = "?clientId=admin";
    
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      return;
    }
    
    socket.value = new WebSocket(`${url+suffix}`);
    
    let keepAliveIntervalId = null;

    socket.value.onopen = () => {
      console.log("WebSocket connection opened. Ready state:", socket.value.readyState);
      adminSocketReadyState.value = 1;

      // Start sending ping messages every 10 seconds
      keepAliveIntervalId = setInterval(() => {
        if (socket.value.readyState === WebSocket.OPEN) {
          socket.value.send(JSON.stringify({ type: "ping" }));
        }
      }, 10000);
    };
    
    socket.value.onmessage = (event) => {
      handleMessage(event.data);
      lastMessageTime.value = new Date();
    };
    
    socket.value.onclose = () => {
      console.log("WebSocket connection closed");
      setTimeout(initializeWebSocket, reconnectInterval);
      adminSocketReadyState.value = 3;
      clearInterval(keepAliveIntervalId);
    };
    
    socket.value.onerror = (error) => {
      console.error(`WebSocket error: ${error}`);
      adminSocketReadyState.value = 3;
    };
  }

  function handleMessage(message) {
    try {
      message = JSON.parse(message);
    } catch (e) {
      console.log("Message is not JSON: ", message);
      return;
    }

    if (message.command === "updateClients") {
      clients.value = message.clients;
      
      // When client list is updated, trigger device store update
      notifyDevicesStore();
    } 
    else if (message.command === "getClientsMap") {
      clients.value = message.clientsArray;
      
      // When client list is updated, trigger device store update
      notifyDevicesStore();
    } 
    else if (message.command === "measurements") {
      let client = clients.value.find(client => client.mac === message.mac);
      if (client) {
        client.data = message.data;
        
        // When measurements are updated, trigger a device update if the device has changed
        notifyDevicesStore();
      }
    }
  }
  
  // Notify the devices store when WebSocket data changes
  function notifyDevicesStore() {
    try {
      const devicesStore = useDevicesStore();
      
      // We only need to refresh if we're initialized
      if (devicesStore.devices.length > 0) {
        devicesStore.fetchDevices();
      }
    } catch (error) {
      console.error('Error notifying devices store:', error);
    }
  }

  // Connection status as a computed property
  const connectionStatus = computed(() => {
    if (!socket.value) return 'disconnected';
    
    switch (socket.value.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  });

  return {
    initializeWebSocket,
    clients,
    socket,
    adminSocketReadyState,
    lastMessageTime,
    connectionStatus
  };
});