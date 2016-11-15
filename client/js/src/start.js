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
    var user = $("#user").val();
    var mapChosen = $("#choseMap1").is(':checked') ? $("#choseMap1").val() : $("#choseMap2").val();
    if (!user) {
      alert("Please insert your username!");
    }
    else {
      // $.ajax({
      //     url: '/game',
      //     type: 'POST',
      //     contentType: 'application/json',
      //     data: JSON.stringify({user: user, map: mapChosen})
      //   }
      // );
      window.location = '/game';
    }
  });
});
