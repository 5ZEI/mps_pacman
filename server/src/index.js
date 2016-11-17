import {server as ws} from 'websocket';
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

// middleware
app.use(function (req, res, next) {
  return next();
});

// get the index route (the only one).
app.get('/', function(req, res, next){
  console.log();
  console.log('[REQ] Client is accessing route: ', req.url);
  console.log("========================================================");
  res.sendFile(path.join(htmlPaths + 'index.html'));
});

// globals for storing client sessions
let connections = {};
let connectionIDCounter = 0;
let usersReadyMap1 = [];
let usersReadyMap2 = [];
let lobbyNamesMap1 = {};
let lobbyNamesMap2 = {};
let lobbyMap1Id = 0;
let lobbyMap2Id = 0;

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
  Object.keys(connections).forEach(function(key) {
    const connection = connections[key];
    if (connection.connected) {
      connection.send(data);
    }
  });
}

// Send a message to a connection by its connectionID
function sendToConnectionId(connectionID, data) {
  console.log("[SEND] Sending to [", connectionID, ", ", /*connections[connectionID].user ,*/ " ]  this data: ", data);
  const connection = connections[connectionID];
  if (connection && connection.connected) {
    connection.send(data);
  }
}

function sendToPlayers(lobby, ready) {
  let players = [];

  for (let id in lobby) {
    players.push(lobby[id]);
  }

  for (let id in lobby) {
    sendToConnectionId(id, JSON.stringify({ready: ready, usersPlaying: players}))
  }
}

// When a client opens a connection
wss.on('request', function(request) {
  // Make sure we only accept requests from an allowed origin
  if (!originIsAllowed(request.origin)) {
    request.reject();
    console.log();
    console.log('[REJECT]' + (new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    console.log("========================================================");
    return;
  }

  // if we accepted the connection we store it in 'connection' variable
  let connection = request.accept(null, request.origin);

  // Store a reference to the connection using an incrementing ID
  connection.id = connectionIDCounter ++;
  connections[connection.id] = connection;

  console.log();
  console.log('[ACCEPT]' + (new Date()) + ' Connection ID ' + connection.id + ' accepted.');
  console.log("========================================================");

  // already received message from user with his choices
  let alreadyReceived = false;
  // the usermap chosen (he can change it while in lobby, waiting)
  let userMap;

  // on message received from connection
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      const messageData = message.utf8Data;
      console.log();
      console.log('[RECV] Received from client: ' + messageData + " id: " + connection.id);
      console.log("========================================================");

      // if user left the lobby
      if (messageData === "leaveLobby") {
        alreadyReceived = false;
        if (userMap === 'map1') {
          // there is one less user ready
          for (let id in lobbyNamesMap1) {
            const keys = Object.keys(lobbyNamesMap1[id]);
            const index = keys.indexOf(String(connection.id));
            if (index > -1) {
              usersReadyMap1[id]--;
              delete lobbyNamesMap1[id][index];
              sendToPlayers(lobbyNamesMap1[id], false);
              break;
            }
          }
        }

        if (userMap === 'map2') {
          // there is one less user ready
          for (let id in lobbyNamesMap2) {
            const keys = Object.keys(lobbyNamesMap2[id]);
            const index = keys.indexOf(String(connection.id));
            if (index > -1) {
              usersReadyMap2[id]--;
              delete lobbyNamesMap2[id][index];
              sendToPlayers(lobbyNamesMap2[id], false);
              break;
            }
          }
        }
      }

      // check if the message is a json string
      if (IsJsonString(messageData)) {
        const data = JSON.parse(messageData);
        // give the connection an username if it is sent and a map.
        if (data.user) {
          connection.user = data.user;
          connection.map = data.map;
          connections[connection.id] = connection;
          // if the user hasn't sent his choices yet
          if (!alreadyReceived && data.map) {
            alreadyReceived = true;
            userMap = data.map;
            let found = false;
            let lobbyWasEmpty = false;
            // in case it's map1
            if (userMap === 'map1') {
              // save user to lobby waiting list
              if (Object.keys(lobbyNamesMap1).length === 0) {
                lobbyWasEmpty = true;
                lobbyNamesMap1[lobbyMap1Id] = {};
                lobbyNamesMap1[lobbyMap1Id][connection.id] = data.user;
                usersReadyMap1[lobbyMap1Id] = 1;
                sendToPlayers(lobbyNamesMap1[lobbyMap1Id], false);
              }
              else for (let id in lobbyNamesMap1) {
                if (usersReadyMap1[id] < 3) {
                  found = true;
                  lobbyNamesMap1[id][connection.id] = data.user;
                  usersReadyMap1[id]++;
                  sendToPlayers(lobbyNamesMap1[id], (usersReadyMap1[id] === 3) ? true : false);
                  break;
                  // if (usersReadyMap1[id] === 3) {
                  //   if (!lobbyNamesMap1[lobbyMap1Id+1]) {
                  //     lobbyMap1Id++;
                  //     lobbyNamesMap1[lobbyMap1Id] = {};
                  //     usersReadyMap1[lobbyMap1Id] = 0;
                  //   }
                  // }
                }
              }
              if (!found && !lobbyWasEmpty) {
                lobbyMap1Id++;
                lobbyNamesMap1[lobbyMap1Id] = {};
                lobbyNamesMap1[lobbyMap1Id][connection._id] = data.user;
                usersReadyMap1[lobbyMap1Id] = 1;
                sendToPlayers(lobbyNamesMap1[lobbyMap1Id], false);
              }
            }
            else if (userMap === 'map2') {
              // save user to lobby waiting list
              if (Object.keys(lobbyNamesMap2).length === 0) {
                lobbyNamesMap2[lobbyMap2Id] = {};
                lobbyNamesMap2[lobbyMap2Id][connection.id] = data.user;
                usersReadyMap2[lobbyMap2Id] = 1;
                sendToPlayers(lobbyNamesMap2[lobbyMap2Id], false);
              }
              else for (let id in lobbyNamesMap2) {
                if (usersReadyMap2 < 3) {
                  found = true;
                  lobbyNamesMap2[id][connection.id] = data.user;
                  usersReadyMap2[id]++;
                  sendToPlayers(lobbyNamesMap2[id], (usersReadyMap2[id] === 3) ? true : false);
                  break;
                  // if (usersReadyMap2[id] === 3) {
                  //   if (!lobbyNamesMap2[lobbyMap2Id+1]) {
                  //     lobbyMap2Id++;
                  //     lobbyNamesMap2[lobbyMap2Id] = {};
                  //     usersReadyMap2[lobbyMap2Id] = 0;
                  //   }
                  // }
                }
              }
              if (!found) {
                lobbyNamesMap2++;
                lobbyNamesMap2[lobbyMap2Id] = {};
                lobbyNamesMap2[lobbyMap2Id][connection._id] = data.user;
                usersReadyMap2[lobbyMap2Id] = 1;
                sendToPlayers(lobbyNamesMap2[lobbyMap2Id], false);
              }
            }
          }
        }
      }
    }
    else if (message.type === 'binary') {
      console.log();
      console.log('[RECV] Received Binary Message of ' + message.binaryData.length + ' bytes');
      console.log("========================================================");
      connection.sendBytes(message.binaryData);
    }
  });

  // on connection closed
  connection.on('close', function(reasonCode, description) {
    console.log();
    console.log();
    console.log("[DISCONNECT]" + (new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected. ' +
                " id: " + connection.id);
    console.log("========================================================");

    // Make sure to remove closed connections from the global pool
    delete connections[connection.id];
    // If the lobby was deleted and the user left the game, update the state so the other players can be sent to lobby page
    if (!lobbyNamesMap1[connection.id] && !lobbyNamesMap2[connection.id] && gamesPlayed) {
      for (let id in gamesPlayed) {
        const keys = Object.keys(gamesPlayed[id]);
        const index = keys.indexOf(String(connection.id));
        if (index > -1) {
          let playersLeft = [];

          delete gamesPlayed[id][keys[index]];

          if (connection.map === 'map1') {
            usersReadyMap1 --;
            const playersInLobby = Object.keys(lobbyNamesMap1);
            if (playersInLobby.length === 0) {
              lobbyNamesMap1 = gamesPlayed[id];
            }
            else if (playersInLobby.length === 1) {
              gamesPlayed[id][playersInLobby[0]] = lobbyNamesMap1[playersInLobby[0]];
              lobbyNamesMap1 = {};
            }
            else if (playersInLobby.length === 2) {
              gamesPlayed[id][playersInLobby[0]] = lobbyNamesMap1[playersInLobby[0]];
              delete lobbyNamesMap1[playersInLobby[0]];
              sendToConnectionId(playersInLobby[1], JSON.stringify({ready: false, usersPlaying: lobbyNamesMap1[playersInLobby[1]]}));
            }
          }
          else if (connection.map === 'map2') {
            usersReadyMap2 --;
            const playersInLobby = Object.keys(lobbyNamesMap2);
            if (Object.keys(lobbyNamesMap2).length === 0) {
              lobbyNamesMap2 = gamesPlayed[id];
            }
            else if (playersInLobby.length === 1) {
              gamesPlayed[id][playersInLobby[0]] = lobbyNamesMap2[playersInLobby[0]];
              lobbyNamesMap2 = {};
            }
            else if (playersInLobby.length === 2) {
              gamesPlayed[id][playersInLobby[0]] = lobbyNamesMap2[playersInLobby[0]];
              delete lobbyNamesMap2[playersInLobby[0]];
              sendToConnectionId(playersInLobby[1], JSON.stringify({ready: false, usersPlaying: lobbyNamesMap2[playersInLobby[1]]}));
            }
          }

          for (let clientId in gamesPlayed[id]) {
            playersLeft.push(gamesPlayed[id][clientId]);
          }

          console.log(playersLeft);

          for (let clientId in gamesPlayed[id]) {
            sendToConnectionId(clientId, JSON.stringify({ready: false, usersPlaying: playersLeft}));
          }

          delete gamesPlayed[id];
          break;
        }
      }
    }
    // if there are less than 3 players in lobby and one leaves, update the situation and send it to the other clients in this lobby.
    else {
      delete lobbyNamesMap1[connection.id];
      delete lobbyNamesMap2[connection.id];

      let playersLeftMap1 = [];
      let playersLeftMap2 = [];
      let id;

      for (id in lobbyNamesMap1) {
        playersLeftMap1.push(lobbyNamesMap1[id]);
      }
      for (id in lobbyNamesMap2) {
        playersLeftMap2.push(lobbyNamesMap2[id]);
      }

      if (connection.map === 'map1') {
        usersReadyMap1 --;
      }

      if (connection.map === 'map2') {
        usersReadyMap2 --;
      }

      for (id in lobbyNamesMap1) {
        sendToConnectionId(id, JSON.stringify({ready: false, usersPlaying: playersLeftMap1}));
      }
      for (id in lobbyNamesMap2) {
        sendToConnectionId(id, JSON.stringify({ready: false, usersPlaying: playersLeftMap2}));
      }
    }
  });
});

// open port 3000 for listening
server.listen(3000, function() {
  console.log('[LISTEN] ' + (new Date()) + 'Server is listening on port 3000');
  console.log("========================================================");
});

//   lobbyNamesMap1[connection.id] = data.user;
            //   usersReadyMap1++;

            //   // if there are three players
            //   if (usersReadyMap1 === 3) {
            //     let players = [];
            //     let id;

            //     for (id in lobbyNamesMap1) {
            //       players.push(lobbyNamesMap1[id]);
            //     }
            //     for (id in lobbyNamesMap1) {
            //       // set the state as ready
            //       sendToConnectionId(id, JSON.stringify({ready: true, usersPlaying: players}));
            //     }

            //     // save the game that started (the players in it)
            //     gamesPlayed[gameId++] = lobbyNamesMap1;
            //     // reset lobby for next players
            //     usersReadyMap1 = 0;
            //     lobbyNamesMap1 = {};
            //   }
            //   // if there are less than three players, update the lobby and send list to connected players
            //   else {
            //     let players = [];
            //     let id;

            //     for (id in lobbyNamesMap1) {
            //       players.push(lobbyNamesMap1[id]);
            //     }
            //     for (id in lobbyNamesMap1) {
            //       sendToConnectionId(id, JSON.stringify({ready: false, usersPlaying: players}));
            //     }
            //   }
            // }
            // // same for map2
            // else if (userMap === 'map2') {
            //   lobbyNamesMap2[connection.id] = data.user;
            //   usersReadyMap2++;

            //   if (usersReadyMap2 === 3) {
            //     let players = [];
            //     let id;

            //     for (id in lobbyNamesMap2) {
            //       players.push(lobbyNamesMap2[id]);
            //     }
            //     for (id in lobbyNamesMap2) {
            //       sendToConnectionId(id, JSON.stringify({ready: true, usersPlaying: players}));
            //     }

            //     gamesPlayed[gameId++] = lobbyNamesMap2;
            //     usersReadyMap2 = 0;
            //     lobbyNamesMap2 = {};
            //   }
            //   else {
            //     let players = [];
            //     let id;

            //     for (id in lobbyNamesMap2) {
            //       players.push(lobbyNamesMap2[id]);
            //     }
            //     for (id in lobbyNamesMap2) {
            //       sendToConnectionId(id, JSON.stringify({ready: false, usersPlaying: players}));
            //     }
            //   }
            // }
          // }
        // }