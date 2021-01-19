'use strict';

const btn = $('.toggle');
const theme = $('#theme');






function getCookie(cname) {
  const name = cname + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

const legacyTheme = getCookie('theme');

function legacyLayout(){
  if(legacyTheme === 'dark'){
    theme.attr('href', "../style/darklayout.css");
  }else{
    theme.attr('href', "../style/lightlayout.css");
  }
}


function toggleTheme(){
  if (theme.attr('href') === '../style/lightlayout.css') {
    theme.attr('href', '../style/darklayout.css');
    document.cookie = 'theme=dark; path=/';
  } else {
    // ... switch it to "light-theme.css"
    theme.attr('href', '../style/lightlayout.css');
    document.cookie = `theme=light; path=/`;
  }
}



legacyLayout();
btn.click(toggleTheme);

// W3 Schools
// function setCookie(cname, cvalue, exdays) {
//   var d = new Date();
//   d.setTime(d.getTime() + (exdays*24*60*60*1000));
//   var expires = "expires="+ d.toUTCString();
//   document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
// }

