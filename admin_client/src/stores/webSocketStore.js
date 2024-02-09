import { defineStore } from "pinia";
import { ref, reactive } from "vue";

export const useWebSocketStore = defineStore("webSocket", () => {
  const clients = ref(new Array());
  const socket = ref(null);
  const reconnectInterval = 5000;
  const adminSocketReadyState = ref(0);


  function initializeWebSocket() {
    socket.value = new WebSocket("ws://localhost:3001/ws/admin?clientId=admin");

    socket.value.onopen = () => {
      console.log("WebSocket connection opened. Ready state: ", socket.value.readyState);
      adminSocketReadyState.value = 1;
    };
    socket.value.onmessage = (event) => {
      // Handle the received message here
      //handleMessage(JSON.parse(event.data));
      handleMessage(event.data);
    };
    socket.value.onclose = () => {
      console.log("WebSocket connection closed");
      setTimeout(initializeWebSocket, reconnectInterval);
      adminSocketReadyState.value = 3;
    };
    socket.value.onerror = (error) => {
      console.error(`WebSocket error: ${error}`);
      adminSocketReadyState.value = 3;
    };
  }

  function handleMessage(message) {
    try {
      message = JSON.parse(message);
    } catch (e){
      console.error("Message is not JSON: ", message);
      return;
    }

    console.log(`Received message: ${message}`);
    if(message.command === "updateClients"){
      clients.value = message.clients;
    } else if(message.command === "getClientsMap"){
      clients.value = message.clientsArray;
    }
  }

  return {
    initializeWebSocket,
    clients,
    socket,
    adminSocketReadyState
  };
});
