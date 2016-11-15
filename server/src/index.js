// import {server as ws} from 'websocket'
// import http from 'http';
import express from 'express';
import ews from 'express-ws';
import path from 'path';

const app = express();
const expressWs = ews(app);
let clientPath = '';
let htmlPaths;
let stop = false;

__dirname.split('/').map( (part) => {
  if (part === 'server') {
    stop = true;
    console.log(clientPath);
  }
  else if (!stop) {
    clientPath += part + '/';
  }
})

clientPath += 'client/';
htmlPaths = clientPath + 'html/';

app.use(express.static(clientPath));

app.use(function (req, res, next) {
  return next();
});

app.get('/', function(req, res, next){
  console.log('get route', req.url, __dirname);
  // res.writeHead(200, {"Content-Type": "text/plain"});
  // res.end("Hello World\n");
  res.sendFile(path.join(htmlPaths + 'start.html'));
  // res.end();
});

app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
  });
  console.log('socket', req.testing);
});

app.listen(3000);

// FOR TESTING COMMUNICATION PURPOSES
// import {client as wsClient} from 'websocket';

// Express init
// const app = express();

// app.use(function(req, res) {
//   console.log((new Date()) + ' Received request for ' + req.url);
//   res.writeHead(200, {"Content-Type": "text/plain"});
//   res.end("Hello World\n");
// });

// // http server creation
// const server = http.createServer(app);

// // open port 8080 for listening
// server.listen(8080, function() {
//   console.log((new Date()) + ' Server is listening on port 8080');
// });

// // open websocket server
// const wsServer = new ws({
//   httpServer: server,
//   // You should not use autoAcceptConnections for production
//   // applications, as it defeats all standard cross-origin protection
//   // facilities built into the protocol and the browser.  You should
//   // *always* verify the connection's origin and decide whether or not
//   // to accept it.
//   autoAcceptConnections: false,
//   path: "/"
// });

// function originIsAllowed(origin) {
//   // put logic here to detect whether the specified origin is allowed.
//   return true;
// }

// // globals for storing client sessions
// let connections = {};
// let connectionIDCounter = 0;

// wsServer.on('request', function(request) {
//   if (!originIsAllowed(request.origin)) {
//     // Make sure we only accept requests from an allowed origin
//     request.reject();
//     console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
//     return;
//   }

//   let connection = request.accept(null, request.origin);

//   // Store a reference to the connection using an incrementing ID
//   connection.id = connectionIDCounter ++;
//   connections[connection.id] = connection;

//   console.log((new Date()) + ' Connection ID ' + connection.id + ' accepted.');

//   // on message received
//   connection.on('message', function(message) {
//     if (message.type === 'utf8') {
//       const messageData = message.utf8Data;
//       // regex for username message: username#<username>
//       const parsed = messageData.split('#');

//       // save the username in connections
//       if (parsed.length === 2 && parsed[0] === 'username') {
//         connections[connection.id].username = parsed[1];
//       }

//       console.log('Received from client: ' + message.utf8Data + " [username, id]: " + connection.username + connection.id);
//       connection.sendUTF("SALUT " + connection.username);
//     }
//     else if (message.type === 'binary') {
//       console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
//       connection.sendBytes(message.binaryData);
//     }
//   });

//   // on connection closed
//   connection.on('close', function(reasonCode, description) {
//     console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected. ' +
//                 "[id, username]: " + connection.id + connection.username);

//     // Make sure to remove closed connections from the global pool
//     delete connections[connection.id];
//   });
// });

// // Broadcast to all open connections
// function broadcast(data) {
//   Object.keys(connections).forEach(function(key) {
//     const connection = connections[key];
//     if (connection.connected) {
//       connection.send(data);
//     }
//   });
// }

// // Send a message to a connection by its connectionID
// function sendToConnectionId(connectionID, data) {
//   var connection = connections[connectionID];
//   if (connection && connection.connected) {
//     connection.send(data);
//   }
// }


// TESTING COMMUNICATION

// const client = new wsClient();

// client.on('connectFailed', function(error) {
//   console.log('Connect Error: ' + error.toString());
// });

// client.on('connect', function(connection) {
//   console.log('WebSocket Client Connected');

//   connection.on('error', function(error) {
//     console.log("Connection Error: " + error.toString());
//   });

//   connection.on('close', function() {
//     console.log('Connection Closed');
//   });

//   connection.on('message', function(message) {
//     if (message.type === 'utf8') {
//       console.log("Received from server: '" + message.utf8Data + "'");
//     }
//   });

//   function sendNumber() {
//     if (connection.connected) {
//       var number = Math.round(Math.random() * 0xFFFFFF);
//       connection.sendUTF(number.toString());
//       // setTimeout(sendNumber, 1000);
//     }
//   }

//   // function to send your username. Must be sent before any other request!
//   function sendUsername() {
//     if (connection.connected) {
//       const username = 'username#Marcel';
//       connection.sendUTF(username);
//     }
//   }

//   sendUsername();
//   sendNumber();
// });

// client.connect('ws://localhost:8080/', null);