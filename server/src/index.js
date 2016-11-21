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
  // console.log();
  // console.log('[REQ] Client is accessing route: ', req.url);
  // console.log("========================================================");
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
let hunterSetForGameMap1 = {};
let hunterSetForGameMap2 = {};
let lobbyMap1Id = 0;
let lobbyMap2Id = 0;
// configurations for users per game;
const usersToStart = 3;
const maxUsersPlaying = 8;
// 20 seconds per hunter
const hunterChangeTime = 20000;
// initial coordinates for map1 (8 players max)
const initialConfigMap1 = [
  {x: 0.5, y: 0.5},
  {x: 521.5, y: 0.5},
  {x: 0.5, y: 400.5},
  {x: 521.5, y: 584.5},
  {x: 521.5, y: 400.5},
  {x: 251.5, y: 281},
  {x: 234, y: 107},
  {x: 472, y: 226}
];
// intitial coordinates for map2 (8 players max)
const initialConfigMap2 = [
  {x: 0.5, y: 0.5},
  {x: 521.5, y: 0.5},
  {x: 0.5, y: 400.5},
  {x: 521.5, y: 584.5},
  {x: 521.5, y: 400.5},
  {x: 272, y: 183},
  {x: 463, y: 326},
  {x: 173, y: 523}
];
// how many times the hunter changes in this game
let hunterChangedCounterMap1 = {};
let hunterChangedCounterMap2 = {};
// save the currentHunter
let currentHunterMap1 = {};
let currentHunterMap2 = {};
// the interval for the hunter change (so we can clear it)
let changeHunterIntervalMap1 = {};
let changeHunterIntervalMap2 = {};

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
  // console.log("[SEND] Sending to [", connectionID, ", "/*, connections[connectionID].user */, " ]  this data: ", data);
  const connection = connections[connectionID];
  if (connection && connection.connected) {
    connection.send(data);
  }
}

// Send the current lobby players and ready state to all the connections on the lobby
function sendPlayersInLobby(lobby, ready) {
  let players = [];
  let othersIds = [];

  for (let id in lobby) {
    if (id !== 'state'){
      players.push(lobby[id]);
    }
  }

  for (let id in lobby) {
    if (id !== 'state'){
      sendToConnectionId(id, JSON.stringify({ready: ready, usersPlaying: players, yourId: id}));
    }
  }
}

// sends a custom message to the players in a lobby
function sendMessageToPlayersInLobby(lobby, message) {

  for (let id in lobby) {
    if (id !== 'state'){
      // console.log("SENDING TO: ", id, " DATA: ", message);
      sendToConnectionId(id, message);
    }
  }
  // console.log("=================================");
}

// sends the players that clicked the ready button to all of the players in the lobby
function sendPlayersReadyInLobby(lobby, ready) {
  if (!ready) {
    return;
  }

  let players = [];
  let playerIds = [];

  for (let id in ready) {
    players.push(ready[id]);
    playerIds.push(id);
  }

  for (let id in lobby) {
    if (id !== 'state'){
      sendToConnectionId(id, JSON.stringify({usersReady: players, usersReadyIds: playerIds, myConnection: id}));
    }
  }
}

// sends the players initial possitions on the map
function sendPlayersInitPositions(userRequested, lobby, lobbyId,  map) {
  const players = {};
  let count = 0;
  let initialHunterId = Object.keys(lobby).length - 2;
  if (map === 'map1'){
    currentHunterMap1[lobbyId] = initialHunterId;
  }
  else if (map === 'map2'){
    currentHunterMap2[lobbyId] = initialHunterId;
  }
  for (let id in lobby) {
    if (id !== 'state'){
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
      if (count === initialHunterId){
        players[id].state = 'hunter';
      }
      else {
        players[id].state = 'hunted';
      }
      players[id].x = (map === 'map1') ? initialConfigMap1[count].x : initialConfigMap2[count].x
      players[id].y = (map === 'map1') ? initialConfigMap1[count].y : initialConfigMap2[count].y
      players[id].width = 30;
      players[id].height = 30;
      players[id].score = 0;

      count ++;
    }
  }
  sendToConnectionId(userRequested, JSON.stringify({usersInitialConfig: players}));
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
      // console.log();
      // console.log('[RECV] Received from client: ' + messageData + " id: " + connection.id);
      // console.log("========================================================");

      // client asks for initial positions
      // also, here we set the interval for the hunter change each x seconds
      if (messageData === 'gimmePlayersPositions') {
        for (let id in lobbyNamesMap1) {
          const keys = Object.keys(lobbyNamesMap1[id]);
          const index = keys.indexOf(String(connection.id));

          if (index > -1) {
            sendPlayersInitPositions(connection.id, lobbyNamesMap1[id], id, 'map1');
            hunterChangedCounterMap1[id] = 0;
            if (!hunterSetForGameMap1[id]) {
              hunterSetForGameMap1[id] = {};
            }
            // console.log('sending player init positions , hunter: ', hunterSetForGameMap1, 'lobbyid: ', id );
            if (!hunterSetForGameMap1[id][hunterChangedCounterMap1[id]]) {
              hunterSetForGameMap1[id][hunterChangedCounterMap1[id]] = true;
              changeHunterIntervalMap1[id] = setInterval(() => {
                hunterChangedCounterMap1[id]++;
                if (hunterChangedCounterMap1[id] === 9) {
                  clearInterval(changeHunterIntervalMap1[id]);
                }
                let randomIndex = Math.floor(Math.random() * keys.length);
                while ( (keys[randomIndex] === 'state') || (keys[randomIndex] === currentHunterMap1[id])) {
                  randomIndex = Math.floor(Math.random() * keys.length);
                }
                currentHunterMap1[id] = keys[randomIndex];
                sendMessageToPlayersInLobby(lobbyNamesMap1[id], `newLeader#${keys[randomIndex]}`);
              }, hunterChangeTime);
              break;
            }
          }
        }
        for (let id in lobbyNamesMap2) {
          const keys = Object.keys(lobbyNamesMap2[id]);
          const index = keys.indexOf(String(connection.id));

          if (index > -1) {
            sendPlayersInitPositions(connection.id, lobbyNamesMap2[id], id, 'map2');
            hunterChangedCounterMap2[id] = 0;
            if (!hunterSetForGameMap2[id]) {
              hunterSetForGameMap2[id] = {};
            }
            if (!hunterSetForGameMap2[id][hunterChangedCounterMap2[id]]) {
              hunterSetForGameMap2[id][hunterChangedCounterMap2[id]] = true;
              changeHunterIntervalMap2[id] = setInterval(() => {
                hunterChangedCounterMap2[id]++;
                if (hunterChangedCounterMap2[id] === 9) {
                  clearInterval(changeHunterIntervalMap2[id]);
                }
                let randomIndex = Math.floor(Math.random() * keys.length);
                while ( (keys[randomIndex] === 'state') || (keys[randomIndex] === currentHunterMap2[id])) {
                  randomIndex = Math.floor(Math.random() * keys.length);
                }
                currentHunterMap2[id] = keys[randomIndex];
                sendMessageToPlayersInLobby(lobbyNamesMap2[id], `newLeader#${keys[randomIndex]}`);
              }, hunterChangeTime);
              break;
            }
          }
        }
      }

      // client notifies server that the game is over
      if (messageData === 'gameOver') {
        for (let id in lobbyNamesMap1) {
          const keys = Object.keys(lobbyNamesMap1[id]);
          const index = keys.indexOf(String(connection.id));

          if (index > -1) {
            hunterChangedCounterMap1[id] = 0;
            usersReadyMap1[id] = 0;
            clearInterval(changeHunterIntervalMap1[id]);
            delete lobbyNamesMap1[id];
            delete usersClickedReadyMap1[id];
            delete hunterSetForGameMap1[id];
            delete changeHunterIntervalMap1[id];
            break;
          }
        }
        for (let id in lobbyNamesMap2) {
          const keys = Object.keys(lobbyNamesMap2[id]);
          const index = keys.indexOf(String(connection.id));

          if (index > -1) {
            hunterChangedCounterMap2[id] = 0;
            usersReadyMap2[id] = 0;
            clearInterval(changeHunterIntervalMap2[id]);
            delete lobbyNamesMap2[id];
            delete usersClickedReadyMap2[id];
            delete hunterSetForGameMap2[id];
            delete changeHunterIntervalMap2[id];
            break;
          }
        }
      }

      // client notifies the server that the game is starting
      if (messageData === 'gameStarting') {
        if (userMap === 'map1') {
          for (let id in lobbyNamesMap1) {
            const keys = Object.keys(lobbyNamesMap1[id]);
            const index = keys.indexOf(String(connection.id));

            if (index > -1) {
              lobbyNamesMap1[id]['state'] = 'started';
              break;
            }
          }
        }
        else if (userMap === 'map2') {
          for (let id in lobbyNamesMap2) {
            const keys = Object.keys(lobbyNamesMap2[id]);
            const index = keys.indexOf(String(connection.id));
            if (index > -1) {
              if (index > -1) {
                lobbyNamesMap2[id]['state'] = 'started';
                break;
              }
            }
          }
        }
      }

      // client notifies the server that he clicked the ready button in lobby
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
              sendPlayersReadyInLobby(lobbyNamesMap1[id], usersClickedReadyMap1[id], connection.id);
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
              sendPlayersReadyInLobby(lobbyNamesMap2[id], usersClickedReadyMap2[id], connection.id);
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
              if (lobbyNamesMap1[id]['state'] === 'started' && usersReadyMap1[id] < usersToStart) {
                sendMessageToPlayersInLobby(lobbyNamesMap1[id], "cantContinueGame");
                lobbyNamesMap1[id]['state'] = 'waiting';
              }
              sendToConnectionId(connection.id, "youLeft");
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
              if (lobbyNamesMap2[id]['state'] === 'started' && usersReadyMap2[id] < usersToStart) {
                sendMessageToPlayersInLobby(lobbyNamesMap2[id], "cantContinueGame")
                lobbyNamesMap2[id]['state'] = 'waiting';
              }
              sendToConnectionId(connection.id, "youLeft");
              sendPlayersInLobby(lobbyNamesMap2[id], (usersReadyMap2[id] >= usersToStart) ? true : false);
              sendPlayersReadyInLobby(lobbyNamesMap2[id], usersClickedReadyMap2[id], connection.id);
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
                lobbyNamesMap1[lobbyMap1Id]['state'] = 'waiting';
                sendPlayersInLobby(lobbyNamesMap1[lobbyMap1Id], false);
              }
              // else search all lobbies for an open spot for this user
              else for (let id in lobbyNamesMap1) {
                if ((usersReadyMap1[id] < maxUsersPlaying) && (lobbyNamesMap1[id]['state'] === 'waiting')){
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
              }
              else for (let id in lobbyNamesMap2) {
                if ((usersReadyMap2[id] < maxUsersPlaying) && (lobbyNamesMap2[id]['state'] === 'waiting')) {
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
                lobbyNamesMap2[lobbyMap2Id]['state'] = 'waiting';
                sendPlayersInLobby(lobbyNamesMap2[lobbyMap2Id], false);
              }
            }
          }
          if (data.map === "map1") {
            sendPlayersReadyInLobby(lobbyNamesMap1[lobbyHeWasPutIn], usersClickedReadyMap1[lobbyHeWasPutIn], connection.id)
          }
          if (data.map === "map2") {
            sendPlayersReadyInLobby(lobbyNamesMap2[lobbyHeWasPutIn], usersClickedReadyMap2[lobbyHeWasPutIn], connection.id)
          }
        }
        // this means that the client sends his new position
        if (data.myNewPosition) {
          for (let id in lobbyNamesMap1) {
            const keys = Object.keys(lobbyNamesMap1[id]);
            const index = keys.indexOf(String(connection.id));

            if (index > -1) {
              for (let nameId in lobbyNamesMap1[id]) {
                if (nameId !== String(connection.id) && nameId !== 'state') {
                  sendToConnectionId(nameId, JSON.stringify({newPosition: {x: data.myNewPosition.x, y: data.myNewPosition.y}, newPositionId: connection.id}));
                }
              }
              break;
            }
          }
          for (let id in lobbyNamesMap2) {
            const keys = Object.keys(lobbyNamesMap2[id]);
            const index = keys.indexOf(String(connection.id));

            if (index > -1) {
              for (let nameId in lobbyNamesMap2[id]) {
                if (nameId !== connection.id && id !== 'state') {
                  sendToConnectionId(nameId, JSON.stringify({newPosition: {x: data.myNewPosition.x, y: data.myNewPosition.y}, newPositionId: connection.id}));
                }
              }
              break;
            }
          }
        }
        // client notifies server that a hunter ate him
        if (data.playerAteMe && data.hunterId && data.me) {
          let newDataForHunter = data.playerAteMe;
          newDataForHunter.score ++;
          let newDataForHunted = data.me;
          (newDataForHunted.score > 0) && (newDataForHunted.score--);

          for (let id in lobbyNamesMap1) {
            const keys = Object.keys(lobbyNamesMap1[id]);
            const index = keys.indexOf(String(connection.id));

            if (index > -1) {
              let xy = Math.floor(Math.random() * Object.keys(lobbyNamesMap1[id]).length);
              (xy < 5) && (xy +=3);
              (xy === 8) && (xy -= 1);
              newDataForHunted.x = initialConfigMap1[xy].x;
              newDataForHunted.y = initialConfigMap1[xy].y;
              sendMessageToPlayersInLobby(lobbyNamesMap1[id], JSON.stringify({newDataForHunter: newDataForHunter, newDataForHunted: newDataForHunted, hunterId: data.hunterId, huntedId: connection.id}));
              break;
            }
          }
          for (let id in lobbyNamesMap2) {
            const keys = Object.keys(lobbyNamesMap2[id]);
            const index = keys.indexOf(String(connection.id));

            if (index > -1) {
              let xy = Math.floor(Math.random() * Object.keys(lobbyNamesMap2[id]).length);
              (xy < 5) && (xy +=3);
              (xy === 8) && (xy -= 1);
              newDataForHunted.x = initialConfigMap2[xy].x;
              newDataForHunted.y = initialConfigMap2[xy].y;
              sendMessageToPlayersInLobby(lobbyNamesMap2[id], JSON.stringify({newDataForHunter: newDataForHunter, newDataForHunted: newDataForHunted, hunterId: data.hunterId, huntedId: connection.id}));
              break;
            }
          }
        }
        // client notifies server that he ate a hunted player
        if (data.iAte && data.huntedId && data.me) {
          let newDataForHunter = data.me;
          newDataForHunter.score ++;
          let newDataForHunted = data.iAte;
          (newDataForHunted.score > 0) && (newDataForHunted.score--);

          for (let id in lobbyNamesMap1) {
            const keys = Object.keys(lobbyNamesMap1[id]);
            const index = keys.indexOf(String(connection.id));

            if (index > -1) {
              let xy = Math.floor(Math.random() * Object.keys(lobbyNamesMap1[id]).length);
              (xy < 5) && (xy +=3);
              (xy === 8) && (xy -= 1);
              newDataForHunted.x = initialConfigMap1[xy].x;
              newDataForHunted.y = initialConfigMap1[xy].y;
              sendMessageToPlayersInLobby(lobbyNamesMap1[id], JSON.stringify({newDataForHunter: newDataForHunter, newDataForHunted: newDataForHunted, hunterId: connection.id, huntedId: data.huntedId}));
              break;
            }
          }
          for (let id in lobbyNamesMap2) {
            const keys = Object.keys(lobbyNamesMap2[id]);
            const index = keys.indexOf(String(connection.id));

            if (index > -1) {
              let xy = Math.floor(Math.random() * Object.keys(lobbyNamesMap2[id]).length);
              (xy < 5) && (xy +=3);
              (xy === 8) && (xy -= 1);
              newDataForHunted.x = initialConfigMap2[xy].x;
              newDataForHunted.y = initialConfigMap2[xy].y;
              sendMessageToPlayersInLobby(lobbyNamesMap2[id], JSON.stringify({newDataForHunter: newDataForHunter, newDataForHunted: newDataForHunted, hunterId: data.hunterId, huntedId: connection.id}));
              break;
            }
          }
        }
      }
    }
    else if (message.type === 'binary') {
      // console.log();
      // console.log('[RECV] Received Binary Message of ' + message.binaryData.length + ' bytes');
      // console.log("========================================================");
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
        if (lobbyNamesMap1[id]['state'] === 'started'/* && usersReadyMap1[id] < usersToStart*/) {
          sendMessageToPlayersInLobby(lobbyNamesMap1[id], "cantContinueGame");
          delete hunterSetForGameMap1[id];
          hunterChangedCounterMap1 = {};
          currentHunterMap1 = {};
          // usersClickedReadyMap1[id] = {};
          clearInterval(changeHunterIntervalMap1[id]);
          delete changeHunterIntervalMap1[id];
          lobbyNamesMap1[id]['state'] = 'waiting';
        }
        sendPlayersInLobby(lobbyNamesMap1[id], (usersReadyMap1[id] >= usersToStart) ? true : false);
        sendPlayersReadyInLobby(lobbyNamesMap1[id], usersClickedReadyMap1[id], connection.id);
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
        if (lobbyNamesMap2[id]['state'] === 'started'/* && usersReadyMap2[id] < usersToStart*/) {
          sendMessageToPlayersInLobby(lobbyNamesMap2[id], "cantContinueGame");
          delete hunterSetForGameMap2[id];
          hunterChangedCounterMap2 = {};
          currentHunterMap2 = {};
          // usersClickedReadyMap2[id] = {};
          clearInterval(changeHunterIntervalMap2[id]);
          delete changeHunterIntervalMap2[id];
          lobbyNamesMap2[id]['state'] = 'waiting';
        }
        sendPlayersInLobby(lobbyNamesMap2[id], (usersReadyMap2[id] >= usersToStart) ? true : false);
        sendPlayersReadyInLobby(lobbyNamesMap2[id], usersClickedReadyMap2[id], connection.id);
        break;
      }
    }
  });
});

// open port 8080 for listening
server.listen(process.env.PORT || 8080, function() {
  console.log('[LISTEN] ' + (new Date()) + 'Server is listening on port 8080');
  console.log("========================================================");
});