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
});