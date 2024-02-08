import { confirm, select, input } from "@inquirer/prompts";
import WebSocket from "ws";
import axios from "axios";

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
    { title: "Restart client", value: "Restart client" },
    { title: "Get clientsMap", value: "getClientsMap" },
    { title: "Get firmware info", value: "getFirmwareInfo"}
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

async function connectWs() {
  if (wsClient == undefined) {
    wsClient = new WebSocket(`ws://localhost:3001/ws/admin?clientId=admin`);
  } else {
    if (wsClient.readyState === WebSocket.OPEN)
      console.log("Connection already open");
    else
      wsClient = new WebSocket(`ws://localhost:3001/ws/admin?clientId=admin`);
  }
  wsClient.on("open", () => console.log("Connected"));
  wsClient.on("close", () => console.log("Disconnected"));
  wsClient.on("message", (data) =>
    console.log("Got the following data: ", data.toString())
  );
  wsClient.on("error", (err) => {
    console.log(`Error ${err}WebSocket`);
  });
}

function sendCommand(command) {
  wsClient.send(command);
}

function restartClient(uuid){
    const url = 'http://localhost:3010/api/restart';
    const data = { 
        uuid: uuid 
    };

    axios.post(url, data)
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
            console.error(`Error: ${error}`);
        });
}

function getLatestVersion(uuid) {
    const command = {
        command: "restart",
        uuid: uuid
    }
    sendCommand(JSON.stringify(command));
}

function _getClientsMap(uuid){
  const url = 'http://localhost:3010/api/getClients';
  const data = { 
      uuid: uuid 
  };

  axios.post(url, data)
      .then(response => {
          console.log(response.data);
      })
      .catch(error => {
          console.error(`Error: ${error}`);
      });
}

function _getFirmwareInfo(){
  const url = 'http://localhost:3010/api/getFirmwareInfo';
  axios.get(url)
      .then(response => {
          console.log(response.data);
      })
      .catch(error => {
          console.error(`Error: ${error}`);
      });
}


async function ask() {
  const command = await select(selectCommand);
  let clientId;
  switch (command) {
    case "Connect":
      console.log("\nWill now connect to websocket server");
      await connectWs();
      break;
    case "Disconnect":
      console.log("\nWill now Disconnect from websocket server");
      wsClient.close();
      break;
    case "Restart client":
      clientId = await input(clientIdQuestion);
      console.log("\nWill now get latest version info");
      //getLatestVersion(clientId);
      restartClient(clientId);

      break;
    case "getClientsMap":
      console.log("\nWill now get clientsMap");
      clientId = await input(clientIdQuestion);
      _getClientsMap(clientId);
    
    case "getFirmwareInfo":
        console.log("\nWill now get firmware info");
        _getFirmwareInfo();
    default:
      console.log("\nUnknown command");
      break;
  }
  await askCont();
}
await ask();
