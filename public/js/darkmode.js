'use strict';

const btn = $('.toggle');
const theme = $('#theme');



function toggleTheme(){
  if (btn.is(':checked')){
    // theme.attr('href', '../style/darklayout.css');
    theme.after('<link id = "dark-mode" href= "../style/darklayout.css" rel= "stylesheet">');
    document.cookie = 'theme=dark; path=/';
  } else {
    // theme.attr('href', '../style/lightlayout.css');
    $('#dark-mode').remove();
    document.cookie = `theme=light; path=/`;
  }
}


btn.click(toggleTheme);


