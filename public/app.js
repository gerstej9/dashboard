'use strict';

const userStatus = $('label').attr('id');

function hideUserStatus(){
  if (userStatus === 'none'){
    $('span').hide();
  }
}

hideUserStatus();