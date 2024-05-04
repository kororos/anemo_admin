import { defineStore } from "pinia";
import { ref, reactive } from "vue";

export const useWebSocketStore = defineStore("webSocket", () => {
  const clients = ref(new Array());
  const socket = ref(null);
  const reconnectInterval = 5000;
  const adminSocketReadyState = ref(0);

  function initializeWebSocket() {
    //socket.value = new WebSocket("ws://localhost:3000/ws/admin?clientId=admin");
    const url = process.env.WS_BASE_URL || "ws://localhost:3000/ws/admin";
    const suffix = "?clientId=admin";
    if(socket.value) { 
      if(socket.value.readyState === WebSocket.OPEN) {
        return;
      }
    }
    socket.value = new WebSocket(
      `${url+suffix}`
    );
    

    let keepAliveIntervalId = null;

    socket.value.onopen = () => {
      console.log(
        "WebSocket connection opened. Ready state: ",
        socket.value.readyState
      );
      adminSocketReadyState.value = 1;

      // Start sending ping messages every 30 seconds
      keepAliveIntervalId = setInterval(() => {
        if (socket.value.readyState === WebSocket.OPEN) {
          socket.value.send(JSON.stringify({ type: "ping" }));
        }
      }, 10000);
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

    //console.log(`Received message: ${JSON.stringify(message)}`);
    if (message.command === "updateClients") {
      clients.value = message.clients;
    } else if (message.command === "getClientsMap") {
      clients.value = message.clientsArray;
    } else if (message.command === "measurements") {
      //console.log("Received measurements: ", message.data);
      let client = clients.value.find(
        (client) => client.mac === message.mac
      );
      client.data = message.data;
    }
  }


  return {
    initializeWebSocket,
    clients,
    socket,
    adminSocketReadyState,
  };
});
