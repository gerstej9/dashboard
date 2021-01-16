'use strict';

const userStatus = $('.userNot').attr('id');
const newUserStatus = $('.userDoes').attr('id');

function hideUserStatus(){
  if (userStatus !== 'no'){
    $('#user-not').hide();
  }
  if(newUserStatus !== 'yes'){
    $('#user-does').hide();
  }
}

hideUserStatus();


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
