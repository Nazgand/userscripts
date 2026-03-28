// ==UserScript==
// @name         Novel Updates Remove Moved Threads
// @namespace    Https://GitHub.Com/Nazgand/UserScripts
// @version      1
// @description  Remove Moved Threads
// @author       Nazgand
// @include     /^https?:\/\/(.*\.)?novelupdatesforum\.com/*
// @grant        none
// ==/UserScript==
document.querySelectorAll('i.fa.fa-share').forEach(function(redirect) {
  const uglyLi = redirect.closest('li');
  uglyLi.parentNode.removeChild(uglyLi);
});
