import { defineStore } from "pinia";
import { ref } from "vue";

export const useWebSocketStore = defineStore("webSocket", () => {
  const clients = ref(new Map());
  const socket = ref(null);
  function initializeWebSocket() {
    if(!socket.value){
      socket.value = new WebSocket("ws://localhost:3001/ws/admin?clientId=admin");
    }
    socket.value.onopen = () => {
      console.log("WebSocket connection opened");
    };
    socket.value.onmessage = (event) => {
      // Handle the received message here
      //handleMessage(JSON.parse(event.data));
      handleMessage(event.data);
    };
    socket.value.onclose = () => {
      console.log("WebSocket connection closed");
    };
    socket.value.onerror = (error) => {
      console.error(`WebSocket error: ${error}`);
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
      clients.value = message.clientsMap;
    }
  }

  return {
    initializeWebSocket,
    clients
  };
});
