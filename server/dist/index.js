'use strict';

var _websocket = require('websocket');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// http server creation
var server = _http2.default.createServer(function (request, response) {
  console.log(new Date() + ' Received request for ' + request.url);
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Hello World\n");
});

// open port 8080 for listening


// FOR TESTING COMMUNICATION PURPOSES
server.listen(8080, function () {
  console.log(new Date() + ' Server is listening on port 8080');
});

// open websocket server
var wsServer = new _websocket.server({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

// globals for storing client sessions
var connections = {};
var connectionIDCounter = 0;

wsServer.on('request', function (request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log(new Date() + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  var connection = request.accept(null, request.origin);

  // Store a reference to the connection using an incrementing ID
  connection.id = connectionIDCounter++;
  connections[connection.id] = connection;

  console.log(new Date() + ' Connection ID ' + connection.id + ' accepted.');

  // on message received
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      var messageData = message.utf8Data;
      // regex for username message: username#<username>
      var parsed = messageData.split('#');

      // save the username in connections
      if (parsed.length === 2 && parsed[0] === 'username') {
        connections[connection.id].username = parsed[1];
      }

      console.log('Received from client: ' + message.utf8Data + " [username, id]: " + connection.username + connection.id);
      connection.sendUTF("SALUT " + connection.username);
    } else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });

  // on connection closed
  connection.on('close', function (reasonCode, description) {
    console.log(new Date() + ' Peer ' + connection.remoteAddress + ' disconnected. ' + "[id, username]: " + connection.id + connection.username);

    // Make sure to remove closed connections from the global pool
    delete connections[connection.id];
  });
});

// Broadcast to all open connections
function broadcast(data) {
  Object.keys(connections).forEach(function (key) {
    var connection = connections[key];
    if (connection.connected) {
      connection.send(data);
    }
  });
}

// Send a message to a connection by its connectionID
function sendToConnectionId(connectionID, data) {
  var connection = connections[connectionID];
  if (connection && connection.connected) {
    connection.send(data);
  }
}

// TESTING COMMUNICATION

var client = new _websocket.client();

client.on('connectFailed', function (error) {
  console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
  console.log('WebSocket Client Connected');

  connection.on('error', function (error) {
    console.log("Connection Error: " + error.toString());
  });

  connection.on('close', function () {
    console.log('Connection Closed');
  });

  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      console.log("Received from server: '" + message.utf8Data + "'");
    }
  });

  function sendNumber() {
    if (connection.connected) {
      var number = Math.round(Math.random() * 0xFFFFFF);
      connection.sendUTF(number.toString());
      // setTimeout(sendNumber, 1000);
    }
  }

  // function to send your username. Must be sent before any other request!
  function sendUsername() {
    if (connection.connected) {
      var username = 'username#Marcel';
      connection.sendUTF(username);
    }
  }

  sendUsername();
  sendNumber();
});

client.connect('ws://localhost:8080/', null);
