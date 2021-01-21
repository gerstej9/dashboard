'use strict';

const modelFound = $('.modelFound').attr('id');

function hideModelFound(){
  console.log(modelFound);
  if(modelFound === 'true'){
    $('.modelFound').hide();
  }
  if(modelFound === 'false'){
    $('.modelFound').show();
  }
}

function prepareModelComparisonPage(){
  $('#modelComparisonPage').attr('action', '/'+$('.user').text()+'/modelcomparison');
  $( '.collectionModelNames' ).each(function() {
    let model = $(this).text();
    $('#comparisonRoundButton').before(`<input type = "hidden" name = "model" value = "${model}"></input>`);
  });
}




prepareModelComparisonPage();
hideModelFound();
// comparisonRoundButton
