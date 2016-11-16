import {server as ws} from 'websocket'
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

// init express
const app = express();
// http server creation
const server = http.createServer(app);
// open websocket server
const wss = new ws({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

// build path to client stuff (for serving static html files)
let clientPath = '';
let htmlPaths;
let stop = false;

__dirname.split('/').map( (part) => {
  if (part === 'server') {
    stop = true;
  }
  else if (!stop) {
    clientPath += part + '/';
  }
})

clientPath += 'client/';
htmlPaths = clientPath + 'html/';

// express configurations
app.use(express.static(clientPath));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
  return next();
});

app.get('/', function(req, res, next){
  console.log('get route', req.url);
  // res.writeHead(200, {"Content-Type": "text/plain"});
  // res.end("Hello World\n");
  res.sendFile(path.join(htmlPaths + 'index.html'));
  // res.end();
});

// globals for storing client sessions
let connections = {};
let connectionIDCounter = 0;

// put logic here to detect whether the specified origin is allowed.
function originIsAllowed(origin) {
  return true;
}

function IsJsonString(str) {
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}

wss.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  let connection = request.accept(null, request.origin);

  // Store a reference to the connection using an incrementing ID
  connection.id = connectionIDCounter ++;
  connections[connection.id] = connection;

  console.log((new Date()) + ' Connection ID ' + connection.id + ' accepted.');

  // on message received
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      const messageData = message.utf8Data;
      console.log('Received from client: ' + messageData + " id: " + connection.id);
      if (IsJsonString(messageData)) {
        const data = JSON.parse(messageData);
        console.log(data.user);
      }
    }
    else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });

  // on connection closed
  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected. ' +
                " id: " + connection.id);

    // Make sure to remove closed connections from the global pool
    delete connections[connection.id];
  });
});

// Broadcast to all open connections
function broadcast(data) {
  Object.keys(connections).forEach(function(key) {
    const connection = connections[key];
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

// open port 3000 for listening
server.listen(3000, function() {
  console.log((new Date()) + ' Server is listening on port 3000');
});
