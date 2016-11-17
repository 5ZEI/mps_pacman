'use strict';

var _toastr = require('toastr');

var _toastr2 = _interopRequireDefault(_toastr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.jQuery = require('jquery');
var bootstrap = require('bootstrap');
var $ = global.jQuery;

// load the js file
function loadScript() {
  require("../browserified/game.js");
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
      if (IsJsonString(event.data)) {
        (function () {
          var _JSON$parse = JSON.parse(event.data),
              ready = _JSON$parse.ready,
              usersPlaying = _JSON$parse.usersPlaying;

          console.log(ready);
          console.log(usersPlaying);
          // if (ready) {
          // start game with users!
          // }
          // else {
          var count = 0;
          var sameName = 0;
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
          while (count < 2) {
            count++;
            document.getElementById('opponent' + count).innerHTML = "Waiting...";
          }
          // }
        })();
      }
    };
  }
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
        connection.send(JSON.stringify({ user: user, map: mapChosen }));
      }
      document.getElementById("welcome").style.display = 'none';
      document.getElementById("lobby").style.display = 'initial';
      document.getElementById("yourPlayer").innerHTML = user;

      waitForUsers();
    }
  });
});
