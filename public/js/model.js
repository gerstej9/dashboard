'use strict';


function prepareModelComparisonPage(){
  $('#modelComparisonPage').attr('action', '/'+$('.user').text()+'/modelcomparison');
  $( '.collectionModelNames' ).each(function() {
    let model = $(this).text();
    $('#comparisonRoundButton').before(`<input type = "hidden" name = "model" value = "${model}"></input>`);
  });
}

function displayModal(){
  const modalTargetModel = $(this).find('.collectionModelNames').html();
  $(`.${modalTargetModel}`).css('display', 'block');
}

function closeModal(){
  $('.myModal').css('display', 'none');
}


$('.myModal').on('click', closeModal);
$('.modelRow').on('click', displayModal);
$('span').on('click', closeModal);
prepareModelComparisonPage();
