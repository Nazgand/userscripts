// ==UserScript==
// @name         Lnmtl Learn Chinese
// @namespace    http://lnmtl.com/chapter/
// @version      0.1
// @description  show the 字 next to the words that would usually be in popups
// @author       Nazgand
// @match        http://lnmtl.com/chapter/*
// @grant        none
// ==/UserScript==
(function () {
  document.querySelector('button.js-toggle-original').click();
  document.querySelectorAll('.translated [data-original-title]').forEach(
    function (e) {
      e.innerText = '{' + e.getAttribute('data-title') + ':' + e.innerText
        + '}';
    });
})();
