'use strict';

const btn = $('.toggle');
const theme = $('#theme');



function toggleTheme(){
  if (btn.is(':checked')){
    theme.attr('href', '../style/darklayout.css');
    document.cookie = 'theme=dark; path=/';
  } else {
    theme.attr('href', '../style/lightlayout.css');
    document.cookie = `theme=light; path=/`;
  }
}


btn.click(toggleTheme);


