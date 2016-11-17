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
let usersClickedReadyMap1 = {};
let usersClickedReadyMap2 = {};
let lobbyNamesMap1 = {};
let lobbyNamesMap2 = {};
let lobbyMap1Id = 0;
let lobbyMap2Id = 0;
// configurations for users per game;
const usersToStart = 3;
const maxUsersPlaying = 8;

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
  console.log("[SEND] Sending to [", connectionID, ", ", connections[connectionID].user , " ]  this data: ", data);
  const connection = connections[connectionID];
  if (connection && connection.connected) {
    connection.send(data);
  }
}

// Send the current lobby players and ready state to all the connections on the lobby
function sendPlayersInLobby(lobby, ready) {
  let players = [];

  for (let id in lobby) {
    players.push(lobby[id]);
  }

  for (let id in lobby) {
    sendToConnectionId(id, JSON.stringify({ready: ready, usersPlaying: players}));
  }
}

function sendPlayersReadyInLobby(lobby, ready) {
  if (!ready) {
    return;
  }

  let players = [];

  for (let id in ready) {
    players.push(ready[id]);
  }

  for (let id in lobby) {
    sendToConnectionId(id, JSON.stringify({usersReady: players}))
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

      if (messageData === 'ready') {
        if (userMap === 'map1') {
          for (let id in lobbyNamesMap1) {
            const keys = Object.keys(lobbyNamesMap1[id]);
            const index = keys.indexOf(String(connection.id));
            if (index > -1) {
              if (!usersClickedReadyMap1[id]){
                usersClickedReadyMap1[id] = {};
              }
              usersClickedReadyMap1[id][connection.id] = connection.user;
              sendPlayersReadyInLobby(lobbyNamesMap1[id], usersClickedReadyMap1[id]);
              break;
            }
          }
        }
        else if (userMap === 'map2') {
          for (let id in lobbyNamesMap2) {
            const keys = Object.keys(lobbyNamesMap2[id]);
            const index = keys.indexOf(String(connection.id));
            if (index > -1) {
              if (!usersClickedReadyMap2[id]){
                usersClickedReadyMap2[id] = {};
              }
              usersClickedReadyMap2[id][connection.id] = connection.user;
              sendPlayersReadyInLobby(lobbyNamesMap2[id], usersClickedReadyMap2[id]);
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
          for (let id in lobbyNamesMap1) {
            const keys = Object.keys(lobbyNamesMap1[id]);
            const index = keys.indexOf(String(connection.id));
            if (index > -1) {
              usersReadyMap1[id]--;
              usersClickedReadyMap1[id] && delete usersClickedReadyMap1[id][keys[index]];
              delete lobbyNamesMap1[id][keys[index]];
              sendPlayersInLobby(lobbyNamesMap1[id], (usersReadyMap1[id] >= usersToStart) ? true : false);
              sendPlayersReadyInLobby(lobbyNamesMap1[id], usersClickedReadyMap1[id]);
              break;
            }
          }
        }

        if (userMap === 'map2') {
          // same for map 2
          for (let id in lobbyNamesMap2) {
            const keys = Object.keys(lobbyNamesMap2[id]);
            const index = keys.indexOf(String(connection.id));
            if (index > -1) {
              usersReadyMap2[id]--;
              usersClickedReadyMap2[id] && delete usersClickedReadyMap2[id][keys[index]];
              delete lobbyNamesMap2[id][keys[index]];
              sendPlayersInLobby(lobbyNamesMap2[id], (usersReadyMap2[id] >= usersToStart) ? true : false);
              sendPlayersReadyInLobby(lobbyNamesMap2[id], usersClickedReadyMap2[id]);
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
          let lobbyHeWasPutIn;
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
              // if there are no lobbies create one with this user and send him info
              if (Object.keys(lobbyNamesMap1).length === 0) {
                lobbyWasEmpty = true;
                lobbyNamesMap1[lobbyMap1Id] = {};
                lobbyNamesMap1[lobbyMap1Id][connection.id] = data.user;
                usersReadyMap1[lobbyMap1Id] = 1;
                lobbyHeWasPutIn = lobbyMap1Id;
                sendPlayersInLobby(lobbyNamesMap1[lobbyMap1Id], false);
              }
              // else search all lobbies for an open spot for this user
              else for (let id in lobbyNamesMap1) {
                if (usersReadyMap1[id] < maxUsersPlaying) {
                  found = true;
                  lobbyNamesMap1[id][connection.id] = data.user;
                  usersReadyMap1[id]++;
                  lobbyHeWasPutIn = id;
                  sendPlayersInLobby(lobbyNamesMap1[id], (usersReadyMap1[id] >= usersToStart) ? true : false);
                  break;
                }
              }
              // if there are no open spots, create a new lobby with this user
              if (!found && !lobbyWasEmpty) {
                lobbyMap1Id ++;
                lobbyNamesMap1[lobbyMap1Id] = {};
                lobbyNamesMap1[lobbyMap1Id][connection.id] = data.user;
                usersReadyMap1[lobbyMap1Id] = 1;
                lobbyHeWasPutIn = lobbyMap1Id;
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
                sendPlayersInLobby(lobbyNamesMap2[lobbyMap2Id], false);
              }
              else for (let id in lobbyNamesMap2) {
                if (usersReadyMap2[id] < maxUsersPlaying) {
                  found = true;
                  lobbyNamesMap2[id][connection.id] = data.user;
                  usersReadyMap2[id]++;
                  lobbyHeWasPutIn = id;
                  sendPlayersInLobby(lobbyNamesMap2[id], (usersReadyMap2[id] >= usersToStart) ? true : false);
                  break;
                }
              }
              if (!found && !lobbyWasEmpty) {
                lobbyMap2Id ++;
                lobbyNamesMap2[lobbyMap2Id] = {};
                lobbyNamesMap2[lobbyMap2Id][connection.id] = data.user;
                usersReadyMap2[lobbyMap2Id] = 1;
                lobbyHeWasPutIn = lobbyMap2Id;
                sendPlayersInLobby(lobbyNamesMap2[lobbyMap2Id], false);
              }
            }
          }
          if (data.map === "map1") {
            sendPlayersReadyInLobby(lobbyNamesMap1[lobbyHeWasPutIn], usersClickedReadyMap1[lobbyHeWasPutIn])
          }
          if (data.map === "map2") {
            sendPlayersReadyInLobby(lobbyNamesMap2[lobbyHeWasPutIn], usersClickedReadyMap2[lobbyHeWasPutIn])
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

    // same as when he backs out of the lobby
    for (let id in lobbyNamesMap1) {
      const keys = Object.keys(lobbyNamesMap1[id]);
      const index = keys.indexOf(String(connection.id));
      if (index > -1) {
        usersReadyMap1[id]--;
        delete lobbyNamesMap1[id][keys[index]];
        usersClickedReadyMap1[id] && delete usersClickedReadyMap1[id][keys[index]];
        sendPlayersInLobby(lobbyNamesMap1[id], (usersReadyMap1[id] >= usersToStart) ? true : false);
        sendPlayersReadyInLobby(lobbyNamesMap1[id], usersClickedReadyMap1[id]);
        break;
      }
    }

    // search him in both lobbies
    for (let id in lobbyNamesMap2) {
      const keys = Object.keys(lobbyNamesMap2[id]);
      const index = keys.indexOf(String(connection.id));
      if (index > -1) {
        usersReadyMap2[id]--;
        delete lobbyNamesMap2[id][keys[index]];
        usersClickedReadyMap2[id] && delete usersClickedReadyMap2[id][keys[index]];
        sendPlayersInLobby(lobbyNamesMap2[id], (usersReadyMap2[id] >= usersToStart) ? true : false);
        sendPlayersReadyInLobby(lobbyNamesMap2[id], usersClickedReadyMap2[id]);
        break;
      }
    }
  });
});

// open port 3000 for listening
server.listen(3000, function() {
  console.log('[LISTEN] ' + (new Date()) + 'Server is listening on port 3000');
  console.log("========================================================");
});