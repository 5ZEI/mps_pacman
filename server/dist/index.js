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
// initial coordinates for map1 (8 players max)
var initialConfigMap1 = [{ x: 0.5, y: 0.5 }, { x: 521.5, y: 0.5 }, { x: 0.5, y: 400.5 }, { x: 521.5, y: 584.5 }, { x: 521.5, y: 400.5 }, { x: 251.5, y: 281 }, { x: 234, y: 107 }, { x: 472, y: 226 }];
// intitial coordinates for map2 (8 players max)
var initialConfigMap2 = [{ x: 0.5, y: 0.5 }, { x: 521.5, y: 0.5 }, { x: 0.5, y: 400.5 }, { x: 521.5, y: 584.5 }, { x: 521.5, y: 400.5 }, { x: 272, y: 183 }, { x: 463, y: 326 }, { x: 173, y: 523 }];

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
  // console.log("[SEND] Sending to [", connectionID, ", "/*, connections[connectionID].user */, " ]  this data: ", data);
  var connection = connections[connectionID];
  if (connection && connection.connected) {
    connection.send(data);
  }
}

// Send the current lobby players and ready state to all the connections on the lobby
function sendPlayersInLobby(lobby, ready) {
  var players = [];
  var othersIds = [];

  for (var id in lobby) {
    if (id !== 'state') {
      players.push(lobby[id]);
    }
  }

  for (var _id in lobby) {
    if (_id !== 'state') {
      sendToConnectionId(_id, JSON.stringify({ ready: ready, usersPlaying: players, yourId: _id }));
    }
  }
}

function sendMessageToPlayersInLobby(lobby, message) {
  for (var id in lobby) {
    if (id !== 'state') {
      sendToConnectionId(id, message);
    }
  }
}

function sendPlayersReadyInLobby(lobby, ready) {
  if (!ready) {
    return;
  }

  var players = [];

  for (var id in ready) {
    players.push(ready[id]);
  }

  for (var _id2 in lobby) {
    if (_id2 !== 'state') {
      sendToConnectionId(_id2, JSON.stringify({ usersReady: players }));
    }
  }
}

function sendPlayersInitPositions(userRequested, lobby, map) {
  var players = {};
  var count = 0;
  var initialHunterId = Object.keys(lobby).length - 2;
  for (var id in lobby) {
    if (id !== 'state') {
      /*
        this will be an object of objects of format:
        playerId: {
          name: playerName,
          state: 'hunter'/'hunted',
          x: Number,
          y: Number,
          width: Number,
          height: Number
          score: Number,
        }
      */
      players[id] = {};
      players[id].name = lobby[id];
      if (count === initialHunterId) {
        players[id].state = 'hunter';
      } else {
        players[id].state = 'hunted';
      }
      players[id].x = map === 'map1' ? initialConfigMap1[count].x : initialConfigMap2[count].x;
      players[id].y = map === 'map1' ? initialConfigMap1[count].y : initialConfigMap2[count].y;
      players[id].width = 30;
      players[id].height = 30;
      players[id].score = 0;

      count++;
    }
  }
  sendToConnectionId(userRequested, JSON.stringify({ usersInitialConfig: players }));
}

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
      // console.log();
      // console.log('[RECV] Received from client: ' + messageData + " id: " + connection.id);
      // console.log("========================================================");

      // client asks for hero change
      if (messageData.split('#').length > 1) {
        var dataReceived = messageData.split('#');
        for (var id in lobbyNamesMap1) {
          var keys = Object.keys(lobbyNamesMap1[id]);
          var index = keys.indexOf(String(connection.id));

          if (index > -1) {
            var xy = Math.floor(Math.random() * keys.length);
            if (dataReceived[1] === 'me' || lobbyNamesMap1[id][keys[xy]] === Number(dataReceived[1])) {
              if (keys[xy] === connection.id) {
                xy++;
                if (xy == 8) {
                  xy -= 2;
                }
              }
            }
            keys[xy] === 'state' && (xy -= 1);
            xy === 8 && (xy -= 1);
            console.log(lobbyNamesMap1[id][keys[xy]], keys[xy]);
            sendMessageToPlayersInLobby(lobbyNamesMap1[id], 'newLeader#' + lobbyNamesMap1[id][keys[xy]]);
            break;
          }
        }
        for (var _id3 in lobbyNamesMap2) {
          var _keys = Object.keys(lobbyNamesMap2[_id3]);
          var _index = _keys.indexOf(String(connection.id));

          if (_index > -1) {
            var _xy = Math.floor(Math.random() * _keys.length);
            if (dataReceived[1] === 'me' || lobbyNamesMap2[_id3][_keys[_xy]] === Number(dataReceived[1])) {
              if (_keys[_xy] === connection.id) {
                _xy++;
                if (_xy == 8) {
                  _xy -= 2;
                }
              }
            }
            _keys[_xy] === 'started' && (_xy -= 1);
            _xy === 8 && (_xy -= 1);
            sendMessageToPlayersInLobby(lobbyNamesMap2[_id3], 'newLeader#' + lobbyNamesMap2[_id3][_keys[_xy]]);
            break;
          }
        }
      }

      // client asks for initial positions
      if (messageData === 'gimmePlayersPositions') {
        for (var _id4 in lobbyNamesMap1) {
          var _keys2 = Object.keys(lobbyNamesMap1[_id4]);
          var _index2 = _keys2.indexOf(String(connection.id));

          if (_index2 > -1) {
            sendPlayersInitPositions(connection.id, lobbyNamesMap1[_id4], 'map1');
            break;
          }
        }
        for (var _id5 in lobbyNamesMap2) {
          var _keys3 = Object.keys(lobbyNamesMap2[_id5]);
          var _index3 = _keys3.indexOf(String(connection.id));

          if (_index3 > -1) {
            sendPlayersInitPositions(connection.id, lobbyNamesMap2[_id5], 'map2');
            break;
          }
        }
      }

      // client notifies server that the game is over
      if (messageData === 'gameOver') {
        for (var _id6 in lobbyNamesMap1) {
          var _keys4 = Object.keys(lobbyNamesMap1[_id6]);
          var _index4 = _keys4.indexOf(String(connection.id));

          if (_index4 > -1) {
            delete lobbyNamesMap1[_id6];
            break;
          }
        }
        for (var _id7 in lobbyNamesMap2) {
          var _keys5 = Object.keys(lobbyNamesMap2[_id7]);
          var _index5 = _keys5.indexOf(String(connection.id));

          if (_index5 > -1) {
            delete lobbyNamesMap2[_id7];
            break;
          }
        }
      }

      // client notifies the server that the game is starting
      if (messageData === 'gameStarting') {
        if (userMap === 'map1') {
          for (var _id8 in lobbyNamesMap1) {
            var _keys6 = Object.keys(lobbyNamesMap1[_id8]);
            var _index6 = _keys6.indexOf(String(connection.id));

            if (_index6 > -1) {
              lobbyNamesMap1[_id8]['state'] = 'started';
              break;
            }
          }
        } else if (userMap === 'map2') {
          for (var _id9 in lobbyNamesMap2) {
            var _keys7 = Object.keys(lobbyNamesMap2[_id9]);
            var _index7 = _keys7.indexOf(String(connection.id));
            if (_index7 > -1) {
              if (_index7 > -1) {
                lobbyNamesMap2[_id9]['state'] = 'started';
                break;
              }
            }
          }
        }
      }

      if (messageData === 'ready') {
        if (userMap === 'map1') {
          for (var _id10 in lobbyNamesMap1) {
            var _keys8 = Object.keys(lobbyNamesMap1[_id10]);
            var _index8 = _keys8.indexOf(String(connection.id));
            if (_index8 > -1) {
              if (!usersClickedReadyMap1[_id10]) {
                usersClickedReadyMap1[_id10] = {};
              }
              usersClickedReadyMap1[_id10][connection.id] = connection.user;
              sendPlayersReadyInLobby(lobbyNamesMap1[_id10], usersClickedReadyMap1[_id10]);
              break;
            }
          }
        } else if (userMap === 'map2') {
          for (var _id11 in lobbyNamesMap2) {
            var _keys9 = Object.keys(lobbyNamesMap2[_id11]);
            var _index9 = _keys9.indexOf(String(connection.id));
            if (_index9 > -1) {
              if (!usersClickedReadyMap2[_id11]) {
                usersClickedReadyMap2[_id11] = {};
              }
              usersClickedReadyMap2[_id11][connection.id] = connection.user;
              sendPlayersReadyInLobby(lobbyNamesMap2[_id11], usersClickedReadyMap2[_id11]);
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
          for (var _id12 in lobbyNamesMap1) {
            var _keys10 = Object.keys(lobbyNamesMap1[_id12]);
            var _index10 = _keys10.indexOf(String(connection.id));
            if (_index10 > -1) {
              usersReadyMap1[_id12]--;
              usersClickedReadyMap1[_id12] && delete usersClickedReadyMap1[_id12][_keys10[_index10]];
              delete lobbyNamesMap1[_id12][_keys10[_index10]];
              if (lobbyNamesMap1[_id12]['state'] === 'started' && usersReadyMap1[_id12] < usersToStart) {
                sendMessageToPlayersInLobby(lobbyNamesMap1[_id12], "cantContinueGame");
                lobbyNamesMap1[_id12]['state'] = 'waiting';
              }
              sendToConnectionId(connection.id, "youLeft");
              sendPlayersInLobby(lobbyNamesMap1[_id12], usersReadyMap1[_id12] >= usersToStart ? true : false);
              sendPlayersReadyInLobby(lobbyNamesMap1[_id12], usersClickedReadyMap1[_id12]);
              break;
            }
          }
        }

        if (userMap === 'map2') {
          // same for map 2
          for (var _id13 in lobbyNamesMap2) {
            var _keys11 = Object.keys(lobbyNamesMap2[_id13]);
            var _index11 = _keys11.indexOf(String(connection.id));
            if (_index11 > -1) {
              usersReadyMap2[_id13]--;
              usersClickedReadyMap2[_id13] && delete usersClickedReadyMap2[_id13][_keys11[_index11]];
              delete lobbyNamesMap2[_id13][_keys11[_index11]];
              if (lobbyNamesMap2[_id13]['state'] === 'started' && usersReadyMap2[_id13] < usersToStart) {
                sendMessageToPlayersInLobby(lobbyNamesMap2[_id13], "cantContinueGame");
                lobbyNamesMap2[_id13]['state'] = 'waiting';
              }
              sendToConnectionId(connection.id, "youLeft");
              sendPlayersInLobby(lobbyNamesMap2[_id13], usersReadyMap2[_id13] >= usersToStart ? true : false);
              sendPlayersReadyInLobby(lobbyNamesMap2[_id13], usersClickedReadyMap2[_id13]);
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
              else for (var _id14 in lobbyNamesMap1) {
                  if (usersReadyMap1[_id14] < maxUsersPlaying && lobbyNamesMap1[_id14]['state'] === 'waiting') {
                    found = true;
                    lobbyNamesMap1[_id14][connection.id] = data.user;
                    usersReadyMap1[_id14]++;
                    lobbyHeWasPutIn = _id14;
                    sendPlayersInLobby(lobbyNamesMap1[_id14], usersReadyMap1[_id14] >= usersToStart ? true : false);
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
                  lobbyNamesMap2[lobbyMap2Id]['state'] = 'waiting';
                  sendPlayersInLobby(lobbyNamesMap2[lobbyMap2Id], false);
                } else for (var _id15 in lobbyNamesMap2) {
                  if (usersReadyMap2[_id15] < maxUsersPlaying && lobbyNamesMap2[_id15]['state'] === 'waiting') {
                    found = true;
                    lobbyNamesMap2[_id15][connection.id] = data.user;
                    usersReadyMap2[_id15]++;
                    lobbyHeWasPutIn = _id15;
                    sendPlayersInLobby(lobbyNamesMap2[_id15], usersReadyMap2[_id15] >= usersToStart ? true : false);
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
        // this means that the client sends his new position
        if (data.myNewPosition) {
          for (var _id16 in lobbyNamesMap1) {
            var _keys12 = Object.keys(lobbyNamesMap1[_id16]);
            var _index12 = _keys12.indexOf(String(connection.id));

            if (_index12 > -1) {
              for (var nameId in lobbyNamesMap1[_id16]) {
                if (nameId !== String(connection.id) && nameId !== 'state') {
                  sendToConnectionId(nameId, JSON.stringify({ newPosition: { x: data.myNewPosition.x, y: data.myNewPosition.y }, newPositionId: connection.id }));
                }
              }
              break;
            }
          }
          for (var _id17 in lobbyNamesMap2) {
            var _keys13 = Object.keys(lobbyNamesMap2[_id17]);
            var _index13 = _keys13.indexOf(String(connection.id));

            if (_index13 > -1) {
              for (var _nameId in lobbyNamesMap2[_id17]) {
                if (_nameId !== connection.id && _id17 !== 'state') {
                  sendToConnectionId(_nameId, JSON.stringify({ newPosition: { x: data.myNewPosition.x, y: data.myNewPosition.y }, newPositionId: connection.id }));
                }
              }
              break;
            }
          }
        }
        // client notifies server that a hunter ate him
        if (data.playerAteMe && data.hunterId && data.me) {
          var newDataForHunter = data.playerAteMe;
          newDataForHunter.score++;
          var newDataForHunted = data.me;
          newDataForHunted.score >= 0 && newDataForHunted.score--;

          for (var _id18 in lobbyNamesMap1) {
            var _keys14 = Object.keys(lobbyNamesMap1[_id18]);
            var _index14 = _keys14.indexOf(String(connection.id));

            if (_index14 > -1) {
              var _xy2 = Math.floor(Math.random() * Object.keys(lobbyNamesMap1[_id18]).length);
              _xy2 < 5 && (_xy2 += 3);
              _xy2 === 8 && (_xy2 -= 1);
              newDataForHunted.x = initialConfigMap1[_xy2].x;
              newDataForHunted.y = initialConfigMap1[_xy2].y;
              sendMessageToPlayersInLobby(lobbyNamesMap1[_id18], JSON.stringify({ newDataForHunter: newDataForHunter, newDataForHunted: newDataForHunted, hunterId: data.hunterId, huntedId: connection.id }));
              break;
            }
          }
          for (var _id19 in lobbyNamesMap2) {
            var _keys15 = Object.keys(lobbyNamesMap2[_id19]);
            var _index15 = _keys15.indexOf(String(connection.id));

            if (_index15 > -1) {
              var _xy3 = Math.floor(Math.random() * Object.keys(lobbyNamesMap2[_id19]).length);
              _xy3 < 5 && (_xy3 += 3);
              _xy3 === 8 && (_xy3 -= 1);
              newDataForHunted.x = initialConfigMap2[_xy3].x;
              newDataForHunted.y = initialConfigMap2[_xy3].y;
              sendMessageToPlayersInLobby(lobbyNamesMap2[_id19], JSON.stringify({ newDataForHunter: newDataForHunter, newDataForHunted: newDataForHunted, hunterId: data.hunterId, huntedId: connection.id }));
              break;
            }
          }
        }
        // client notifies server that he ate a hunted
        if (data.iAte && data.huntedId && data.me) {
          var _newDataForHunter = data.me;
          _newDataForHunter.score++;
          var _newDataForHunted = data.iAte;
          _newDataForHunted.score > 0 && _newDataForHunted.score--;

          for (var _id20 in lobbyNamesMap1) {
            var _keys16 = Object.keys(lobbyNamesMap1[_id20]);
            var _index16 = _keys16.indexOf(String(connection.id));

            if (_index16 > -1) {
              var _xy4 = Math.floor(Math.random() * Object.keys(lobbyNamesMap1[_id20]).length);
              _xy4 < 5 && (_xy4 += 3);
              _xy4 === 8 && (_xy4 -= 1);
              _newDataForHunted.x = initialConfigMap1[_xy4].x;
              _newDataForHunted.y = initialConfigMap1[_xy4].y;
              sendMessageToPlayersInLobby(lobbyNamesMap1[_id20], JSON.stringify({ newDataForHunter: _newDataForHunter, newDataForHunted: _newDataForHunted, hunterId: connection.id, huntedId: data.huntedId }));
              break;
            }
          }
          for (var _id21 in lobbyNamesMap2) {
            var _keys17 = Object.keys(lobbyNamesMap2[_id21]);
            var _index17 = _keys17.indexOf(String(connection.id));

            if (_index17 > -1) {
              var _xy5 = Math.floor(Math.random() * Object.keys(lobbyNamesMap2[_id21]).length);
              _xy5 < 5 && (_xy5 += 3);
              _xy5 === 8 && (_xy5 -= 1);
              _newDataForHunted.x = initialConfigMap2[_xy5].x;
              _newDataForHunted.y = initialConfigMap2[_xy5].y;
              sendMessageToPlayersInLobby(lobbyNamesMap2[_id21], JSON.stringify({ newDataForHunter: _newDataForHunter, newDataForHunted: _newDataForHunted, hunterId: data.hunterId, huntedId: connection.id }));
              break;
            }
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
    for (var id in lobbyNamesMap1) {
      var keys = Object.keys(lobbyNamesMap1[id]);
      var index = keys.indexOf(String(connection.id));
      if (index > -1) {
        usersReadyMap1[id]--;
        delete lobbyNamesMap1[id][keys[index]];
        usersClickedReadyMap1[id] && delete usersClickedReadyMap1[id][keys[index]];
        if (lobbyNamesMap1[id]['state'] === 'started' && usersReadyMap1[id] < usersToStart) {
          sendMessageToPlayersInLobby(lobbyNamesMap1[id], "cantContinueGame");
          lobbyNamesMap1[id]['state'] = 'waiting';
        }
        sendPlayersInLobby(lobbyNamesMap1[id], usersReadyMap1[id] >= usersToStart ? true : false);
        sendPlayersReadyInLobby(lobbyNamesMap1[id], usersClickedReadyMap1[id]);
        break;
      }
    }

    // search him in both lobbies
    for (var _id22 in lobbyNamesMap2) {
      var _keys18 = Object.keys(lobbyNamesMap2[_id22]);
      var _index18 = _keys18.indexOf(String(connection.id));
      if (_index18 > -1) {
        usersReadyMap2[_id22]--;
        delete lobbyNamesMap2[_id22][_keys18[_index18]];
        usersClickedReadyMap2[_id22] && delete usersClickedReadyMap2[_id22][_keys18[_index18]];
        if (lobbyNamesMap2[_id22]['state'] === 'started' && usersReadyMap2[_id22] < usersToStart) {
          sendMessageToPlayersInLobby(lobbyNamesMap2[_id22], "cantContinueGame");
          lobbyNamesMap2[_id22]['state'] = 'waiting';
        }
        sendPlayersInLobby(lobbyNamesMap2[_id22], usersReadyMap2[_id22] >= usersToStart ? true : false);
        sendPlayersReadyInLobby(lobbyNamesMap2[_id22], usersClickedReadyMap2[_id22]);
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
