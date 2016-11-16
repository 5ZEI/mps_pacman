import toastr from 'toastr';

global.jQuery = require('jquery');
const bootstrap = require('bootstrap');
const $ = global.jQuery;

// load the js file
function loadScript() {
  require("../browserified/game.js");
}

$(document).ready(function() {
  $("#choseMap1").click(function() {
    if ($("#choseMap2").is(':checked')) {
      $("#choseMap2").removeAttr('checked');
    }
    else if (!$("#choseMap1").is(':checked')){
      $("#choseMap1").prop('checked', true);
    }
  });
  $("#choseMap2").click(function() {
    if ($("#choseMap1").is(':checked')) {
      $("#choseMap1").removeAttr('checked');
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
        connection.send(JSON.stringify({user: user}));
      }
      document.getElementById("welcome").style.display = 'none';
      document.getElementById("game").style.display = 'initial';
      loadScript();
    }
  });
});
