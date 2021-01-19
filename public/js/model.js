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

hideModelFound();
