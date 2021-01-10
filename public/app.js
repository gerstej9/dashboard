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
