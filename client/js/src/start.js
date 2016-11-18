import toastr from 'toastr';
import {getInitialConfiguration, getNewPositions} from './game.js';

global.jQuery = require('jquery');
const bootstrap = require('bootstrap');
const $ = global.jQuery;
let timeoutGame;
let timeoutLoader;

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
    connection.onmessage = function(event) {
      if (event.data === "cantContinueGame") {
        clearTimeout(timeoutGame);
        clearTimeout(timeoutLoader);
        timeoutGame = null;
        timeoutLoader = null;
        if (document.getElementById("game").style.display !== 'none') {
          toastr.options.positionClass = 'toast-top-right';
          toastr.error('Minimul de jucatori nu este implinit', 'Joc oprit!');
        }
        document.getElementById("wait").innerHTML = "Waiting for players...";
        makeWaitingNice("Waiting for players...".length);
        document.getElementById("gameover").style.display = 'none';
        document.getElementById("lobby").style.display = 'initial';
      }

      if (event.data === "youLeft") {
        clearTimeout(timeoutGame);
        clearTimeout(timeoutLoader);
        timeoutGame = null;
        timeoutLoader = null;
        toastr.options.positionClass = 'toast-top-right';
        toastr.success('Ai parasit lobby-ul', 'Notificare!');
        document.getElementById("wait").innerHTML = "Waiting for players...";
        document.getElementById("gameover").style.display = 'none';
        makeWaitingNice("Waiting for players...".length);
      }

      if (IsJsonString(event.data)) {
        const {
          yourId,
          ready,
          usersPlaying,
          usersReady,
          usersInitialConfig,
          newPosition,
          newPositionId
        } = JSON.parse(event.data);
        let count = 0;
        let sameName = 0;

        if (ready!==undefined && usersPlaying !== undefined && yourId !== undefined) {
          readyState = ready;
          usersJoined = usersPlaying;
          myId = yourId;
        }

        if (usersReady !== undefined) {
          usersReadyToPlay = usersReady;
        }

        if (usersInitialConfig !== undefined) {
          getInitialConfiguration(usersInitialConfig);
        }

        if (newPosition !== undefined && newPositionId !== undefined) {
          getNewPositions(newPosition, newPositionId);
        }

        if (usersPlaying) {
          usersPlaying.map((connectedUser) => {
            if (connectedUser === user) {
              sameName++;
              if (sameName > 1) {
                count++;
                document.getElementById(`opponent${count}`).innerHTML = connectedUser;
              }
            }
            else {
              count++;
              document.getElementById(`opponent${count}`).innerHTML = connectedUser;
            }
          })
          while (count < 7) {
            count++;
            document.getElementById(`opponent${count}`).innerHTML = "Waiting...";
            document.getElementById(`opponent${count}`).style.color = "#3cb0fd";
          }

          if (ready) {
             document.getElementById('startGame').style.display = "initial";
          }
          else {
             document.getElementById('startGame').style.display = "none";
          }
        }
        if (usersReady) {
          if (usersReady.indexOf(user) > -1) {
            document.getElementById("yourPlayer").style.color = "#c7e825"
          }
          else {
            document.getElementById("yourPlayer").style.color = "yellow";
          }
          for (let i = 1 ; i < 8 ; i ++) {
            const doc = document.getElementById(`opponent${i}`)
            const player = doc.innerHTML;
            if (usersReady.indexOf(player) > -1) {
              doc.style.color = "#66ff66";
            }
            else {
              doc.style.color = "#3cb0fd";
            }
          }
          if (readyState && (usersReady.length === usersJoined.length)) {
            connection.send("gameStarting");
            document.getElementById("wait").innerHTML = "Starting...";
            makeWaitingNice("Starting...".length);
            if (!timeoutGame) {
              timeoutGame = setTimeout(() => {
                loadScript();
                if (connected) {
                  connection.send('gimmePlayersPositions');
                }
                document.getElementById("lobby").style.display = 'none';
                document.getElementById("game").style.display = 'initial';
                document.getElementById("wait").innerHTML = "Waiting for players...";
                setTimeout(() => {
                  document.getElementById("game").style.display = 'none';
                  document.getElementById("gameover").style.display = 'initial';
                  connection.send("gameOver");
                  // DISPLAY SCORE
                }, 180000)
              }, /*10000*/1000);
            }
          }
        }
      }
    }
  }
}

function makeWaitingNice(initialLength) {
  // if (!timeoutLoader) {
    timeoutLoader = setTimeout(() => {
      const text = document.getElementById("wait").innerHTML;
      document.getElementById("wait").innerHTML = (text.length===initialLength-2 || text.length===initialLength-1) ? (text + '.') : text.substring(0, text.length - 2);
      if (document.getElementById("lobby").style.display !== 'none' && (Math.abs(initialLength - text.length) <= 2)) {
        makeWaitingNice(initialLength);
      }
    }, 1000)
  // }
}

$(document).ready(function() {
  $("#choseMap1").click(function() {
    if ($("#choseMap2").is(':checked')) {
      $("#choseMap2").prop('checked', false);
    }
    else if (!$("#choseMap1").is(':checked')){
      $("#choseMap1").prop('checked', true);
    }
  });
  $("#choseMap2").click(function() {
    if ($("#choseMap1").is(':checked')) {
      $("#choseMap1").prop('checked', false);
    }
    else if (!$("#choseMap2").is(':checked')){
      $("#choseMap2").prop('checked', true);
    }
  });
  $("#chooseForm").submit(function(event) {
    event.preventDefault();
    user = $("#user").val();
    mapChosen = $("#choseMap1").is(':checked') ? $("#choseMap1").val() : $("#choseMap2").val();
    if (!user) {
      toastr.options.positionClass = 'toast-top-right'
      toastr.error('Completati campul "Username"', 'Eroare!')
    }
    else {
      if (connected) {
        // give my data to the server
        connection.send(JSON.stringify({user: user, map: mapChosen}));
      }
      document.getElementById("welcome").style.display = 'none';
      document.getElementById("lobby").style.display = 'initial';
      document.getElementById("yourPlayer").innerHTML = user;

      waitForUsers();
      document.getElementById("wait").innerHTML = "Waiting for players...";
      makeWaitingNice(document.getElementById("wait").innerHTML.length)
    }
  });

  $("#startGame").click(function() {
    if (connected) {
      // tell the server i'm ready
      connection.send("ready");
      document.getElementById("startGame").disabled = true;
      document.getElementById("startGame").innerHTML = "READY";
    }
  });
});
