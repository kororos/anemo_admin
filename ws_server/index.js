import { WebSocketServer } from "ws";

const wss = new WebSocketServer({
    port: 4000,
    handleProtocols: (protocols, req) => {
        console.log(`Incoming protocol requests '${protocols}'`);
        const protocolsSet = new Set(protocols);

        if (protocolsSet.has('arduino')) {
            return 'arduino';
        }else if (protocolsSet.has('esp32')) {
            return 'esp32';
        }else if (protocolsSet.has('esp8266')) {
            return 'esp8266';
        }else{
            return false;
        }
    },
    

    
    // perMessageDeflate: {
    //   zlibDeflateOptions: {
    //     // See zlib defaults.
    //     chunkSize: 1024,
    //     memLevel: 7,
    //     level: 3
    //   },
    //   zlibInflateOptions: {
    //     chunkSize: 10 * 1024
    //   },
    //   // Other options settable:
    //   clientNoContextTakeover: true, // Defaults to negotiated value.
    //   serverNoContextTakeover: true, // Defaults to negotiated value.
    //   serverMaxWindowBits: 10, // Defaults to negotiated value.
    //   // Below options specified as default values.
    //   concurrencyLimit: 10, // Limits zlib concurrency for perf.
    //   threshold: 1024 // Size (in bytes) below which messages
    //   // should not be compressed if context takeover is disabled.
    // }
  });

  wss.on('connection', function connection(ws, req) {
    console.log("A new client connected");
    console.log('req.url:', req.url);
    console.log('req.headers:', req.headers);

    ws.on('error', console.error);
  
    ws.on('message', function message(data) {
      console.log('received: %s', data);
    });
  
    ws.on('close', function close() {
      console.log('disconnected');
    });
    ws.on('headers', function headers(headers,request) {
        console.log('headers: %s', headers);
        console.log('request: %s', request);
        }
    );
    ws.on('wsClientError', function wsClientError(error,socket,req) {
        console.log('error: %s', error);
        console.log('socket: %s', socket);
        console.log('req: %s', req);
        });

    ws.send('Lefteris', {binary:false}, function ack(error) {
        console.log('in ack');
        if (error) {
          console.error('Error sending message: ', error);
        }
      });
  });
  
  console.log("WebSocket server is running on port 4000");