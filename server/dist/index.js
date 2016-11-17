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

// middleware
app.use(function (req, res, next) {
  return next();
});

// get the index route (the only one).
app.get('/', function (req, res, next) {
  console.log();
  console.log('[REQ] Client is accessing route: ', req.url);
  console.log("========================================================");
  res.sendFile(_path2.default.join(htmlPaths + 'index.html'));
});

// globals for storing client sessions
var connections = {};
var connectionIDCounter = 0;
var usersReadyMap1 = [];
var usersReadyMap2 = [];
var usersClickedReadyMap1 = {};
var usersClickedReadyMap2 = {};
var lobbyNamesMap1 = {};
var lobbyNamesMap2 = {};
var lobbyMap1Id = 0;
var lobbyMap2Id = 0;
// configurations for users per game;
var usersToStart = 3;
var maxUsersPlaying = 8;

// put logic here to detect whether the specified origin is allowed.
function originIsAllowed(origin) {
  return true;
}

// check if a received message from the client is a stringified json
function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

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
  console.log("[SEND] Sending to [", connectionID, ", ", connections[connectionID].user, " ]  this data: ", data);
  var connection = connections[connectionID];
  if (connection && connection.connected) {
    connection.send(data);
  }
}

// Send the current lobby players and ready state to all the connections on the lobby
function sendPlayersInLobby(lobby, ready) {
  var players = [];

  for (var _id in lobby) {
    players.push(lobby[_id]);
  }

  for (var _id2 in lobby) {
    sendToConnectionId(_id2, JSON.stringify({ ready: ready, usersPlaying: players }));
  }
}

function sendPlayersReadyInLobby(lobby, ready) {
  if (!ready) {
    return;
  }

  var players = [];

  for (var _id3 in ready) {
    players.push(ready[_id3]);
  }

  for (var _id4 in lobby) {
    sendToConnectionId(_id4, JSON.stringify({ usersReady: players }));
  }
}

function sendPlayersInitPositions(lobby) {}

// When a client opens a connection
wss.on('request', function (request) {
  // Make sure we only accept requests from an allowed origin
  if (!originIsAllowed(request.origin)) {
    request.reject();
    console.log();
    console.log('[REJECT]' + new Date() + ' Connection from origin ' + request.origin + ' rejected.');
    console.log("========================================================");
    return;
  }

  // if we accepted the connection we store it in 'connection' variable
  var connection = request.accept(null, request.origin);

  // Store a reference to the connection using an incrementing ID
  connection.id = connectionIDCounter++;
  connections[connection.id] = connection;

  console.log();
  console.log('[ACCEPT]' + new Date() + ' Connection ID ' + connection.id + ' accepted.');
  console.log("========================================================");

  // already received message from user with his choices
  var alreadyReceived = false;
  // the usermap chosen (he can change it while in lobby, waiting)
  var userMap = void 0;

  // on message received from connection
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      var messageData = message.utf8Data;
      console.log();
      console.log('[RECV] Received from client: ' + messageData + " id: " + connection.id);
      console.log("========================================================");

      if (messageData === 'gimmePlayersPositions') {}

      if (messageData === 'gameStarting') {
        if (userMap === 'map1') {
          for (var _id5 in lobbyNamesMap1) {
            var keys = Object.keys(lobbyNamesMap1[_id5]);
            var index = keys.indexOf(String(connection.id));

            if (index > -1) {
              lobbyNamesMap1[_id5]['state'] = 'started';
              break;
            }
          }
        } else if (userMap === 'map2') {
          for (var _id6 in lobbyNamesMap2) {
            var _keys = Object.keys(lobbyNamesMap2[_id6]);
            var _index = _keys.indexOf(String(connection.id));
            if (_index > -1) {
              if (_index > -1) {
                lobbyNamesMap2[_id6]['state'] = 'started';
                break;
              }
            }
          }
        }
      }

      if (messageData === 'ready') {
        if (userMap === 'map1') {
          for (var _id7 in lobbyNamesMap1) {
            var _keys2 = Object.keys(lobbyNamesMap1[_id7]);
            var _index2 = _keys2.indexOf(String(connection.id));
            if (_index2 > -1) {
              if (!usersClickedReadyMap1[_id7]) {
                usersClickedReadyMap1[_id7] = {};
              }
              usersClickedReadyMap1[_id7][connection.id] = connection.user;
              sendPlayersReadyInLobby(lobbyNamesMap1[_id7], usersClickedReadyMap1[_id7]);
              break;
            }
          }
        } else if (userMap === 'map2') {
          for (var _id8 in lobbyNamesMap2) {
            var _keys3 = Object.keys(lobbyNamesMap2[_id8]);
            var _index3 = _keys3.indexOf(String(connection.id));
            if (_index3 > -1) {
              if (!usersClickedReadyMap2[_id8]) {
                usersClickedReadyMap2[_id8] = {};
              }
              usersClickedReadyMap2[_id8][connection.id] = connection.user;
              sendPlayersReadyInLobby(lobbyNamesMap2[_id8], usersClickedReadyMap2[_id8]);
              break;
            }
          }
        }
      }

      // if user left the lobby
      if (messageData === "leaveLobby") {
        alreadyReceived = false;
        if (userMap === 'map1') {
          // remove him from the lobby that he is in (check in all of the lobbies) and notify others
          for (var _id9 in lobbyNamesMap1) {
            var _keys4 = Object.keys(lobbyNamesMap1[_id9]);
            var _index4 = _keys4.indexOf(String(connection.id));
            if (_index4 > -1) {
              usersReadyMap1[_id9]--;
              usersClickedReadyMap1[_id9] && delete usersClickedReadyMap1[_id9][_keys4[_index4]];
              delete lobbyNamesMap1[_id9][_keys4[_index4]];
              if (lobbyNamesMap1[_id9]['state'] === 'started' && usersReadyMap1[_id9] < usersToStart) {
                lobbyNamesMap1[_id9]['state'] = 'waiting';
              }
              sendPlayersInLobby(lobbyNamesMap1[_id9], usersReadyMap1[_id9] >= usersToStart ? true : false);
              sendPlayersReadyInLobby(lobbyNamesMap1[_id9], usersClickedReadyMap1[_id9]);
              break;
            }
          }
        }

        if (userMap === 'map2') {
          // same for map 2
          for (var _id10 in lobbyNamesMap2) {
            var _keys5 = Object.keys(lobbyNamesMap2[_id10]);
            var _index5 = _keys5.indexOf(String(connection.id));
            if (_index5 > -1) {
              usersReadyMap2[_id10]--;
              usersClickedReadyMap2[_id10] && delete usersClickedReadyMap2[_id10][_keys5[_index5]];
              delete lobbyNamesMap2[_id10][_keys5[_index5]];
              if (lobbyNamesMap2[_id10]['state'] === 'started' && usersReadyMap2[_id10] < usersToStart) {
                lobbyNamesMap2[_id10]['state'] = 'waiting';
              }
              sendPlayersInLobby(lobbyNamesMap2[_id10], usersReadyMap2[_id10] >= usersToStart ? true : false);
              sendPlayersReadyInLobby(lobbyNamesMap2[_id10], usersClickedReadyMap2[_id10]);
              break;
            }
          }
        }
      }

      // check if the message is a json string
      if (IsJsonString(messageData)) {
        var data = JSON.parse(messageData);
        // give the connection an username if it is sent and a map.
        if (data.user) {
          var lobbyHeWasPutIn = void 0;
          connection.user = data.user;
          connection.map = data.map;
          connections[connection.id] = connection;
          // if the user hasn't sent his choices yet
          if (!alreadyReceived && data.map) {
            alreadyReceived = true;
            userMap = data.map;
            var found = false;
            var lobbyWasEmpty = false;
            // in case it's map1
            if (userMap === 'map1') {
              // if there are no lobbies create one with this user and send him info
              if (Object.keys(lobbyNamesMap1).length === 0) {
                lobbyWasEmpty = true;
                lobbyNamesMap1[lobbyMap1Id] = {};
                lobbyNamesMap1[lobbyMap1Id][connection.id] = data.user;
                usersReadyMap1[lobbyMap1Id] = 1;
                lobbyHeWasPutIn = lobbyMap1Id;
                lobbyNamesMap1[lobbyMap1Id]['state'] = 'waiting';
                sendPlayersInLobby(lobbyNamesMap1[lobbyMap1Id], false);
              }
              // else search all lobbies for an open spot for this user
              else for (var _id11 in lobbyNamesMap1) {
                  console.log("STATE IS!!!!!: ", lobbyNamesMap1[_id11]['state']);
                  if (usersReadyMap1[_id11] < maxUsersPlaying && lobbyNamesMap1[_id11]['state'] === 'waiting') {
                    found = true;
                    lobbyNamesMap1[_id11][connection.id] = data.user;
                    usersReadyMap1[_id11]++;
                    lobbyHeWasPutIn = _id11;
                    sendPlayersInLobby(lobbyNamesMap1[_id11], usersReadyMap1[_id11] >= usersToStart ? true : false);
                    break;
                  }
                }
              // if there are no open spots, create a new lobby with this user
              if (!found && !lobbyWasEmpty) {
                lobbyMap1Id++;
                lobbyNamesMap1[lobbyMap1Id] = {};
                lobbyNamesMap1[lobbyMap1Id][connection.id] = data.user;
                usersReadyMap1[lobbyMap1Id] = 1;
                lobbyHeWasPutIn = lobbyMap1Id;
                lobbyNamesMap1[lobbyMap1Id]['state'] = 'waiting';
                sendPlayersInLobby(lobbyNamesMap1[lobbyMap1Id], false);
              }
            }
            // same for map 2
            else if (userMap === 'map2') {
                if (Object.keys(lobbyNamesMap2).length === 0) {
                  lobbyWasEmpty = true;
                  lobbyNamesMap2[lobbyMap2Id] = {};
                  lobbyNamesMap2[lobbyMap2Id][connection.id] = data.user;
                  usersReadyMap2[lobbyMap2Id] = 1;
                  lobbyHeWasPutIn = lobbyMap2Id;
                  lobbyNamesMap2[id][lobbyMap2Id]['state'] = 'waiting';
                  sendPlayersInLobby(lobbyNamesMap2[lobbyMap2Id], false);
                } else for (var _id12 in lobbyNamesMap2) {
                  if (usersReadyMap2[_id12] < maxUsersPlaying && lobbyNamesMap2[_id12]['state'] === 'waiting') {
                    found = true;
                    lobbyNamesMap2[_id12][connection.id] = data.user;
                    usersReadyMap2[_id12]++;
                    lobbyHeWasPutIn = _id12;
                    sendPlayersInLobby(lobbyNamesMap2[_id12], usersReadyMap2[_id12] >= usersToStart ? true : false);
                    break;
                  }
                }
                if (!found && !lobbyWasEmpty) {
                  lobbyMap2Id++;
                  lobbyNamesMap2[lobbyMap2Id] = {};
                  lobbyNamesMap2[lobbyMap2Id][connection.id] = data.user;
                  usersReadyMap2[lobbyMap2Id] = 1;
                  lobbyHeWasPutIn = lobbyMap2Id;
                  lobbyNamesMap2[lobbyMap2Id]['state'] = 'waiting';
                  sendPlayersInLobby(lobbyNamesMap2[lobbyMap2Id], false);
                }
              }
          }
          if (data.map === "map1") {
            sendPlayersReadyInLobby(lobbyNamesMap1[lobbyHeWasPutIn], usersClickedReadyMap1[lobbyHeWasPutIn]);
          }
          if (data.map === "map2") {
            sendPlayersReadyInLobby(lobbyNamesMap2[lobbyHeWasPutIn], usersClickedReadyMap2[lobbyHeWasPutIn]);
          }
        }
      }
    } else if (message.type === 'binary') {
      console.log();
      console.log('[RECV] Received Binary Message of ' + message.binaryData.length + ' bytes');
      console.log("========================================================");
      connection.sendBytes(message.binaryData);
    }
  });

  // on connection closed
  connection.on('close', function (reasonCode, description) {
    console.log();
    console.log();
    console.log("[DISCONNECT]" + new Date() + ' Peer ' + connection.remoteAddress + ' disconnected. ' + " id: " + connection.id);
    console.log("========================================================");

    // Make sure to remove closed connections from the global pool
    delete connections[connection.id];

    // same as when he backs out of the lobby
    for (var _id13 in lobbyNamesMap1) {
      var keys = Object.keys(lobbyNamesMap1[_id13]);
      var index = keys.indexOf(String(connection.id));
      if (index > -1) {
        usersReadyMap1[_id13]--;
        delete lobbyNamesMap1[_id13][keys[index]];
        usersClickedReadyMap1[_id13] && delete usersClickedReadyMap1[_id13][keys[index]];
        if (lobbyNamesMap1[_id13]['state'] === 'started' && usersReadyMap1[_id13] < usersToStart) {
          lobbyNamesMap1[_id13]['state'] = 'waiting';
        }
        sendPlayersInLobby(lobbyNamesMap1[_id13], usersReadyMap1[_id13] >= usersToStart ? true : false);
        sendPlayersReadyInLobby(lobbyNamesMap1[_id13], usersClickedReadyMap1[_id13]);
        break;
      }
    }

    // search him in both lobbies
    for (var _id14 in lobbyNamesMap2) {
      var _keys6 = Object.keys(lobbyNamesMap2[_id14]);
      var _index6 = _keys6.indexOf(String(connection.id));
      if (_index6 > -1) {
        usersReadyMap2[_id14]--;
        delete lobbyNamesMap2[_id14][_keys6[_index6]];
        usersClickedReadyMap2[_id14] && delete usersClickedReadyMap2[_id14][_keys6[_index6]];
        if (lobbyNamesMap2[_id14]['state'] === 'started' && usersReadyMap2[_id14] < usersToStart) {
          lobbyNamesMap2[_id14]['state'] = 'waiting';
        }
        sendPlayersInLobby(lobbyNamesMap2[_id14], usersReadyMap2[_id14] >= usersToStart ? true : false);
        sendPlayersReadyInLobby(lobbyNamesMap2[_id14], usersClickedReadyMap2[_id14]);
        break;
      }
    }
  });
});

// open port 3000 for listening
server.listen(3000, function () {
  console.log('[LISTEN] ' + new Date() + 'Server is listening on port 3000');
  console.log("========================================================");
});
