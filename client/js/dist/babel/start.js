'use strict';

var _toastr = require('toastr');

var _toastr2 = _interopRequireDefault(_toastr);

var _game = require('./game.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.jQuery = require('jquery');
var bootstrap = require('bootstrap');
var $ = global.jQuery;
var timeoutGame = void 0;
var timeoutLoader = void 0;
var gameTime = 180000;
var startTime = 3000;

// load the js file
function loadScript() {
  require("./game.js");
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

// wait for the users to connect to this lobby before starting the game
function waitForUsers() {
  if (connected) {
    connection.onmessage = function (event) {
      // if game is done, we clear the timeouts and go back to lobby screen
      if (event.data === "cantContinueGame") {
        clearTimeout(timeoutGame);
        clearTimeout(timeoutLoader);
        timeoutGame = null;
        timeoutLoader = null;
        if (document.getElementById("game").style.display !== 'none') {
          document.getElementById("game").style.display = 'none';
          _toastr2.default.options.positionClass = 'toast-top-right';
          _toastr2.default.error('Unul din jucatori a parasit jocul', 'Joc oprit!');
        }
        document.getElementById("wait").innerHTML = "Waiting for players...";
        makeWaitingNice("Waiting for players...".length);
        for (var i = 1; i < 8; i++) {
          document.getElementById('optionalOp' + i).style.display = 'none';
          document.getElementById('Op' + i).innerHTML = '';
          document.getElementById('Op' + i + 'Score').innerHTML = '';
        }
        document.getElementById("gameover").style.display = 'none';
        document.getElementById("lobby").style.display = 'initial';
      }

      // if the player left, we notify him and change the lobby state
      if (event.data === "youLeft") {
        clearTimeout(timeoutGame);
        clearTimeout(timeoutLoader);
        timeoutGame = null;
        timeoutLoader = null;
        _toastr2.default.options.positionClass = 'toast-top-right';
        _toastr2.default.success('Ai parasit lobby-ul', 'Notificare!');
        document.getElementById("wait").innerHTML = "Waiting for players...";
        document.getElementById("gameover").style.display = 'none';
        for (var _i = 1; _i < 8; _i++) {
          document.getElementById('optionalOp' + _i).style.display = 'none';
          document.getElementById('Op' + _i).innerHTML = '';
          document.getElementById('Op' + _i + 'Score').innerHTML = '';
        }
        makeWaitingNice("Waiting for players...".length);
      }

      // if we got a message with the new leader, change him by calling the method defined in game.js
      if (event.data.split("#").length > 1 && event.data.split('#')[0] === 'newLeader') {
        (0, _game.changeLeader)(Number(event.data.split('#')[1]));
      }

      if (IsJsonString(event.data)) {
        (function () {
          var _JSON$parse = JSON.parse(event.data),
              yourId = _JSON$parse.yourId,
              ready = _JSON$parse.ready,
              usersPlaying = _JSON$parse.usersPlaying,
              usersReady = _JSON$parse.usersReady,
              usersInitialConfig = _JSON$parse.usersInitialConfig,
              newPosition = _JSON$parse.newPosition,
              newPositionId = _JSON$parse.newPositionId,
              newDataForHunter = _JSON$parse.newDataForHunter,
              newDataForHunted = _JSON$parse.newDataForHunted,
              hunterId = _JSON$parse.hunterId,
              huntedId = _JSON$parse.huntedId,
              usersReadyIds = _JSON$parse.usersReadyIds,
              myConnection = _JSON$parse.myConnection;

          var count = 0;
          var sameName = 0;

          // set those global variables
          if (ready !== undefined && usersPlaying !== undefined && yourId !== undefined) {
            readyState = ready;
            usersJoined = usersPlaying.slice();
            myId = yourId;
          }

          if (usersReady !== undefined) {
            usersReadyToPlay = usersReady.slice();
          }

          // se the initial configuration gotten from the server
          if (usersInitialConfig !== undefined) {
            (0, _game.getInitialConfiguration)(usersInitialConfig);
          }

          // set the new positions for each object gotten from the server
          if (newPosition !== undefined && newPositionId !== undefined) {
            (0, _game.getNewPositions)(newPosition, newPositionId);
          }

          // if the hunter eats, set scores and respawn the eaten player.
          if (newDataForHunted !== undefined && newDataForHunter !== undefined && hunterId !== undefined && huntedId !== undefined) {
            (0, _game.getNewScoresAndRespawn)(newDataForHunter, newDataForHunted, Number(hunterId), Number(huntedId));
          }

          // set the lobby users (waiting... or names)
          if (usersPlaying) {
            sameName = 0;
            count = 0;
            usersPlaying.map(function (connectedUser) {
              if (connectedUser === user) {
                sameName++;
                if (sameName > 1) {
                  count++;
                  document.getElementById('opponent' + count).innerHTML = connectedUser;
                }
              } else {
                count++;
                document.getElementById('opponent' + count).innerHTML = connectedUser;
              }
            });
            while (count < 7) {
              count++;
              document.getElementById('opponent' + count).innerHTML = "Waiting...";
              document.getElementById('opponent' + count).style.color = "#3cb0fd";
            }

            // if there are enough users, show the ready button
            if (ready) {
              document.getElementById('startGame').style.display = "initial";
            } else {
              document.getElementById('startGame').style.display = "none";
            }
          }
          // change lobby colors for the users that clicked ready
          if (usersReady && usersReadyIds && myConnection) {
            var auxUsersReady = usersReady.slice();
            if (usersReadyIds.indexOf(myConnection) > -1) {
              if (auxUsersReady[usersReadyIds.indexOf(myConnection)]) {
                document.getElementById("yourPlayer").style.color = "#c7e825";
                auxUsersReady.splice(usersReadyIds.indexOf(myConnection), 1);
              }
            } else {
              document.getElementById("yourPlayer").style.color = "yellow";
            }
            for (var _i2 = 1; _i2 < 8; _i2++) {
              var doc = document.getElementById('opponent' + _i2);
              var player = doc.innerHTML;
              if (auxUsersReady.indexOf(player) > -1) {
                auxUsersReady.splice(auxUsersReady.indexOf(player), 1);
                doc.style.color = "#66ff66";
              } else {
                doc.style.color = "#3cb0fd";
              }
            }
            if (readyState && usersReady.length === usersJoined.length) {
              connection.send("gameStarting");
              document.getElementById("wait").innerHTML = "Starting...";
              makeWaitingNice("Starting...".length);
              if (!timeoutGame) {
                timeoutGame = setTimeout(function () {
                  loadScript();
                  if (connected) {
                    connection.send('gimmePlayersPositions');
                  }
                  document.getElementById("lobby").style.display = 'none';
                  document.getElementById("game").style.display = 'initial';
                  document.getElementById("wait").innerHTML = "Waiting for players...";
                  setTimeout(function () {
                    sameName = 0;
                    count = 0;
                    var auxOthers = jQuery.extend(true, {}, others);
                    usersReady.map(function (playingUser) {
                      if (playingUser === user) {
                        sameName++;
                        if (sameName === 1) {
                          document.getElementById('yourUser').innerHTML = playingUser;
                          document.getElementById("yourUser").style.color = "yellow";
                          document.getElementById("yourScore").style.color = "yellow";
                          document.getElementById('yourScore').innerHTML = me.score;
                        }
                        if (sameName > 1) {
                          count++;
                          document.getElementById('optionalOp' + count).style.display = 'table-row';
                          document.getElementById('Op' + count).innerHTML = playingUser;
                          for (var otherPl in auxOthers) {
                            if (auxOthers[otherPl].name === playingUser) {
                              document.getElementById('Op' + count + 'Score').innerHTML = auxOthers[otherPl].score;
                              delete auxOthers[otherPl];
                              break;
                            }
                          }
                        }
                      } else {
                        count++;
                        document.getElementById('optionalOp' + count).style.display = 'table-row';
                        document.getElementById('Op' + count).innerHTML = playingUser;
                        for (var _otherPl in auxOthers) {
                          if (auxOthers[_otherPl].name === playingUser) {
                            document.getElementById('Op' + count + 'Score').innerHTML = auxOthers[_otherPl].score || 0;
                            delete auxOthers[_otherPl];
                            break;
                          }
                        }
                      }
                    });
                    while (count < 7) {
                      count++;
                      document.getElementById('optionalOp' + count).style.display = 'none';
                      document.getElementById('Op' + count).style.display = 'none';
                      document.getElementById('Op' + count + 'Score').style.display = 'none';
                    }
                    document.getElementById("game").style.display = 'none';
                    document.getElementById("gameover").style.display = 'initial';
                    connection.send("gameOver");
                  }, gameTime);
                }, startTime);
              }
            }
          }
        })();
      }
    };
  }
}

function makeWaitingNice(initialLength) {
  // if (!timeoutLoader) {
  timeoutLoader = setTimeout(function () {
    var text = document.getElementById("wait").innerHTML;
    document.getElementById("wait").innerHTML = text.length === initialLength - 2 || text.length === initialLength - 1 ? text + '.' : text.substring(0, text.length - 2);
    if (document.getElementById("lobby").style.display !== 'none' && Math.abs(initialLength - text.length) <= 2) {
      makeWaitingNice(initialLength);
    }
  }, 1000);
  // }
}

$(document).ready(function () {
  $("#choseMap1").click(function () {
    if ($("#choseMap2").is(':checked')) {
      $("#choseMap2").prop('checked', false);
    } else if (!$("#choseMap1").is(':checked')) {
      $("#choseMap1").prop('checked', true);
    }
  });
  $("#choseMap2").click(function () {
    if ($("#choseMap1").is(':checked')) {
      $("#choseMap1").prop('checked', false);
    } else if (!$("#choseMap2").is(':checked')) {
      $("#choseMap2").prop('checked', true);
    }
  });
  $("#chooseForm").submit(function (event) {
    event.preventDefault();
    user = $("#user").val();
    mapChosen = $("#choseMap1").is(':checked') ? $("#choseMap1").val() : $("#choseMap2").val();
    if (!user) {
      _toastr2.default.options.positionClass = 'toast-top-right';
      _toastr2.default.error('Completati campul "Username"', 'Eroare!');
    } else {
      if (connected) {
        // give my data to the server
        connection.send(JSON.stringify({ user: user, map: mapChosen }));
      }
      document.getElementById("welcome").style.display = 'none';
      document.getElementById("lobby").style.display = 'initial';
      document.getElementById("yourPlayer").innerHTML = user;

      waitForUsers();
      document.getElementById("wait").innerHTML = "Waiting for players...";
      makeWaitingNice(document.getElementById("wait").innerHTML.length);
    }
  });

  $("#startGame").click(function () {
    if (connected) {
      // tell the server i'm ready
      connection.send("ready");
      document.getElementById("startGame").disabled = true;
      document.getElementById("startGame").innerHTML = "READY";
    }
  });
});
