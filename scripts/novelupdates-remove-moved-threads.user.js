// ==UserScript==
// @name         Novel Updates Remove Moved Threads
// @namespace    https://github.com/nazgand/userscripts
// @version      0.1
// @description  Remove Moved Threads
// @author       Nazgand
// @match        http://forum.novelupdates.com/forums/*
// @grant        none
// ==/UserScript==
document.querySelectorAll('i.fa.fa-share').forEach(function(redirect) {
  const uglyLi = redirect.closest('li');
  uglyLi.parentNode.removeChild(uglyLi);
});
