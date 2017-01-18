// ==UserScript==
// @name         Novel Updates Remove Moved Threads
// @namespace    https://github.com/nazgand/userscripts
// @version      0.1
// @description  Remove Moved Threads
// @author       Nazgand
// @match        http://forum.novelupdates.com/forums/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var uglyRedirects=document.querySelectorAll("i.fa.fa-share");
    for(var i=0;i<uglyRedirects.length;i++){
        var uglyLi=uglyRedirects[i].closest("li");
        uglyLi.parentNode.removeChild(uglyLi);
    }
})();
