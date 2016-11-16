'use strict';

var _websocket = require('websocket');

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// init express
var app = (0, _express2.default)();
// http server creation
var server = _http2.default.createServer(app);
// open websocket server
var wss = new _websocket.server({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

// build path to client stuff (for serving static html files)
var clientPath = '';
var htmlPaths = void 0;
var stop = false;

__dirname.split('/').map(function (part) {
  if (part === 'server') {
    stop = true;
  } else if (!stop) {
    clientPath += part + '/';
  }
});

clientPath += 'client/';
htmlPaths = clientPath + 'html/';

// express configurations
app.use(_express2.default.static(clientPath));
app.use(_bodyParser2.default.urlencoded({ extended: false }));
app.use(_bodyParser2.default.json());

app.use(function (req, res, next) {
  return next();
});

app.get('/', function (req, res, next) {
  console.log('get route', req.url);
  // res.writeHead(200, {"Content-Type": "text/plain"});
  // res.end("Hello World\n");
  res.sendFile(_path2.default.join(htmlPaths + 'index.html'));
  // res.end();
});

// globals for storing client sessions
var connections = {};
var connectionIDCounter = 0;

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

wss.on('request', function (request) {
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
      console.log('Received from client: ' + messageData + " id: " + connection.id);
      if (IsJsonString(messageData)) {
        var data = JSON.parse(messageData);
        console.log(data.user);
      }
    } else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });

  // on connection closed
  connection.on('close', function (reasonCode, description) {
    console.log(new Date() + ' Peer ' + connection.remoteAddress + ' disconnected. ' + " id: " + connection.id);

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

// open port 3000 for listening
server.listen(3000, function () {
  console.log(new Date() + ' Server is listening on port 3000');
});
