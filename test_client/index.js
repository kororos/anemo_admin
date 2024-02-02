import { confirm, select, input } from "@inquirer/prompts";
import WebSocket from "ws";

let wsClient;
const questions = {
  message: "Issue another command?",
  default: true,
  transformer: (answer) => (answer ? "👍" : "👎"),
};

const selectCommand = {
  message: "What command do you want to issue?",
  choices: [
    { title: "Connect", value: "Connect" },
    { title: "Disconnect", value: "Disconnect" },
    { title: "Get latest version", value: "Get latest version" },
  ],
};

const clientIdQuestion = {
  message: "Enter clientId",
};

async function askCont() {
  const answers = await confirm(questions);
  if (answers) {
    await ask();
  } else {
    wsClient.close();
    return false;
  }
}

async function connectWs(clientId) {
  if (wsClient == undefined) {
    wsClient = new WebSocket(`ws://localhost:3000/ws/anemometer?clientId=${clientId}`);
  } else {
    if (wsClient.readyState === WebSocket.OPEN)
      console.log("Connection already open");
    else wsClient = new WebSocket(`ws://localhost:3000/ws/anemometer?clientId=${clientId}`);
  }
  wsClient.on("open", () => console.log("Connected"));
  wsClient.on("close", () => console.log("Disconnected"));
  wsClient.on("message", async (data) => {
    console.log("Got the following data: ", data.toString());
    switch (data.toString()){
      case "restart" :
        await wsClient.close();
        connectWs(clientId);
    }
  }
  );
  wsClient.on("error", (err) => {
      console.log(`Error ${err}WebSocket`);
  });
}

function sendCommand(command) {
  wsClient.send(command);
}

function getLatestVersion() {
  sendCommand("getVer");
}

async function ask() {
  const command = await select(selectCommand);
  switch (command) {
    case "Connect":
      console.log("\nWill now connect to websocket server");
      const clientId = await input(clientIdQuestion);
      console.log(`ClientId is: ${clientId}`);
      await connectWs(clientId);
      break;
    case "Disconnect":
      console.log("\nWill now Disconnect from websocket server");
      wsClient.close();
      break;
    case "Get latest version":
      console.log("\nWill now get latest version info");
      getLatestVersion();
      break;
    default:
      console.log("\nUnknown command");
      break;
  }
  await askCont();
}
await ask();
