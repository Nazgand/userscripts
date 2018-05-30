// ==UserScript==
// @name         Lnmtl Learn Chinese
// @namespace    http://lnmtl.com/chapter/
// @version      0.3
// @description  show the 字 next to the words that would usually be in popups
// @author       Nazgand
// @match        http://lnmtl.com/chapter/*
// @match        https://lnmtl.com/chapter/*
// @grant        none
// ==/UserScript==
document.querySelector('button.js-toggle-original').click();
document.querySelectorAll('.translated [data-original-title]').forEach(
  function(e) {
    e.innerText = '{' + e.getAttribute('data-title') + ':' + e.innerText + '}';
    e.style.whiteSpace = 'nowrap';
  });
document.querySelector('a[id=scrollUp]').remove();
document.querySelector('div.crate').remove();
