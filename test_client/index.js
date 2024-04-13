import { confirm, select, input } from "@inquirer/prompts";
import WebSocket from "ws";
import mqtt from "mqtt";

let wsClient, prodWsClient;
let data = {
  clientId: "",
  hwVersion: "",
  swVersion: "",
  mac: "00:11:22:33:44:55"
};

const prodSensorData = {
  time: "anytime", // get epoch time
  ver: "1.22.0_DHT22",
  device: "Emulator",
  sensors: [
    {
      sensor: "magneto",
      data: "122",
      min_x: "0",
      max_x: "10",
      min_y: "0",
      max_y: "10",
      min_z: "0",
      max_z: "10"
    },
    {
      sensor: "speed",
      data: {
        data: "10", //meters per second, 
        rotpersec: "7", //rotations per second
      }
    },
    {
      sensor: "temperature",
      data: "20"
    },
    {
      sensor: "humidity",
      data: "50"
    },
    {
      sensor: "analogue",
      data: "0.5"
    }
  ]
}

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
    { title: "Connect to PRODUCTION WS", value: "Connect to PRODUCTION WS" },
    { title: "Connect to PRODUCTION MQTT", value: "Connect to PRODUCTION MQTT" }

  ],
};

const clientIdQuestion = {
  message: "Enter clientId",
};

const hwVersionQuestion = {
  message: "Enter HW version",
};

const swVersionQuestion = {
  message: "Enter current SW version",
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

async function connetToProdMqtt() {
  const client = mqtt.connect(process.env.MQTT_PROD_BASE_URL)

  client.on("connect", () => {
    console.log("Connected to PRODUCTION MQTT");
    //const data = `anemometer,device=Emulator temp=20,hummidity=50,rotPerSec=7,direction=122,version="1.22.0_DHT22"`;
    //client.publish("sensors", data);
    setInterval(() => {
      let temp = Math.random() * 40;
      let hummidity = Math.random() * 100;
      let rotPerSec = Math.random() * 20;
      let direction = Math.random() * 360;
      const fwVersion = "1.22.0_11";
      const hwVersion = "DHT11";
      const fullVersion = fwVersion + "-" + hwVersion;
      const data = `anemometer,device=Emulator temp=${temp},hummidity=${hummidity},rotPerSec=${rotPerSec},direction=${direction},version=${fwVersion}`;
      //const data = `anemometer,device=Emulator temp=20,hummidity=50,rotPerSec=7,direction=122,version="1.22.0_DHT22"`;
      client.publish("sensors", data);
    }, 1000);
  });
  client.on("error", (err) => {
    console.log(`Error ${err}MQTT`);
  });
}



async function connectProdWs() {
  if (prodWsClient == undefined) {
    prodWsClient = new WebSocket(`${process.env.WS_PROD_BASE_URL}?clientId=${data.clientId}&hwVersion=${data.hwVersion}&swVersion=${data.swVersion}&mac=${data.mac}`);
  } else {
    if (prodWsClient.readyState === WebSocket.OPEN)
      console.log("Connection already open");
    else prodWsClient = new WebSocket(`${process.env.WS_PROD_BASE_URL}?clientId=${data.clientId}&hwVersion=${data.hwVersion}&swVersion=${data.swVersion}&mac=${data.mac}`);
  }
  prodWsClient.on("open", () => {
    console.log("[PRODUCTION WS]: Connected")
    setInterval(() => {
      //console.log("[PRODUCTION WS]: Sending data");
      //console.log("[PRODUCTION WS]: Data sent: ", JSON.stringify(prodSensorData));
      prodWsClient.send(prepareWsData(data.clientId, data.hwVersion, data.swVersion));
    }, 1000);
  });
  prodWsClient.on("close", () => console.log("[PRODUCTION WS]: Disconnected"));
  prodWsClient.on("message", async (message) => {
    console.log("[PRODUCTION WS]: Got the following data: ", message.toString());
    switch (message.toString()) {
      case "restart":
        await prodWsClient.close();
        connectProdWs();
    }
  });
  prodWsClient.on("error", (err) => {
    console.log(`[PRODUCTION WS]: Error ${err}WebSocket`);
  });
}

async function connectWs() {
  let intervalId;
  if (wsClient == undefined) {
    console.log("Connecting to WS - mac: ", data.mac);
    wsClient = new WebSocket(`${process.env.WS_BASE_URL}?clientId=${data.clientId}&hwVersion=${data.hwVersion}&swVersion=${data.swVersion}&mac=${data.mac}`);
  } else {
    if (wsClient.readyState === WebSocket.OPEN)
      console.log("Connection already open");
    else wsClient = new WebSocket(`${process.env.WS_BASE_URL}?clientId=${data.clientId}&hwVersion=${data.hwVersion}&swVersion=${data.swVersion}&mac=${data.mac}`);
  }
  wsClient.on("open", () => {
    console.log("Connected");
    intervalId = setInterval(() => {
      wsClient.send(prepareWsData(data.clientId, data.hwVersion, data.swVersion));
    }, 1000);
  });
  wsClient.on("close", () => {
    console.log("Disconnected");
    clearInterval(intervalId);
  });
  wsClient.on("message", async (message) => {
    console.log("Got the following data: ", message.toString());
    switch (message.toString()) {
      case "restart":
        await wsClient.close();
        await connectWs();
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
      const hwVersion = await input(hwVersionQuestion);
      const swVersion = await input(swVersionQuestion);

      data = {
        clientId: clientId,
        hwVersion: hwVersion,
        swVersion: swVersion,
        mac: "00:11:22:33:44:55"
      };

      await connectWs();
      break;
    case "Connect to PRODUCTION WS":
      console.log("\nWill now connect to PRODUCTION websocket server");
      const clientIdProd = await input(clientIdQuestion);
      const hwVersionProd = await input(hwVersionQuestion);
      const swVersionProd = await input(swVersionQuestion);

      data = {
        clientId: clientIdProd,
        hwVersion: hwVersionProd,
        swVersion: swVersionProd,
      };

      await connectProdWs();
      break;
    case "Connect to PRODUCTION MQTT":
      console.log("\nWill now connect to PRODUCTION MQTT server");
      connetToProdMqtt();
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

function prepareWsData(device, fwVer, hwVer) {
  const speed = Math.random() * 30;
  const rotPerSec = Math.random() * 30;
  const temp = Math.random() * 40;
  const hummidity = Math.random() * 100;

  const data = {

    time: Date.now(),
    fwVer: fwVer,
    hwVer: hwVer,
    device: device,
    sensors: [
      {
        sensor: "magneto",
        data: Math.random() * 360,
        min_x: 0,
        max_x: 0,
        min_y: 0,
        max_y: 0,
        min_z: 0,
        max_z: 0
      },
      {
        sensor: "speed",
        data: {
          data: speed,
          rotPerSec: rotPerSec,
        }
      },
      {
        sensor: "temperature",
        data: temp
      },
      {
        sensor: "humidity",
        data: hummidity
      },
      {
        sensor: "analog",
        data: 1
      }
    ]
  }
  const message = {
    type: "measurements",
    clientId: device,
    mac: "00:11:22:33:44:55",
    data: data
  }
  return JSON.stringify(message);
}
await ask();
