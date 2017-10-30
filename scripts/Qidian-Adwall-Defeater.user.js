// ==UserScript==
// @name         Qidian Adwall Defeater
// @namespace    whatever
// @version      4
// @description  passes adwall
// @author       <nazgand@gmail.com>
// @match        https://www.webnovel.com/book/*
// @match        https://www.webnovel.com/rssbook/*
// @grant        none
// @homepage     https://github.com/nazgand/userscripts
// ==/UserScript==

//Suggested use: with Google Chrome AutoMute Extension

function autoClickBook() {
  const btnCheckIn = document.querySelector('a.fr.j_check_in');
  if (btnCheckIn !== null) {
    btnCheckIn.click();
  }
  autoClickBookPlay();
}
function autoClickBookPlay() {
  const btnPlay = document.querySelector('a.bt._play');
  if (btnPlay !== null) {
    btnPlay.click();
    setTimeout(autoClickBookSkip, 15000);
  } else {
    const divLockVideo = document.querySelector('div.lock-video');
    const pContinued = document.querySelector('p.cha-ft[id="continued"]');
    if (pContinued === null || divLockVideo !== null) {
      setTimeout(autoClickBookPlay, 1000);
    }
  }
}
function autoClickBookSkip() {
  const btnSkip = document.querySelector('a.bt._skip.j_can_skip');
  if (btnSkip !== null) {
    btnSkip.click();
    setTimeout(autoClickBookPlay, 2000);
  } else {
    setTimeout(autoClickBookSkip, 1000);
  }
}
if (document.location.href.startsWith('https://www.webnovel.com/book/')) {
  setTimeout(autoClickBook, 500);
}

function autoClickRSSBook() {
  let btnRead = document.querySelector('a.bt.j_read[disabled]');
  if (btnRead === null) {
    btnRead = document.querySelector('a.bt.j_read');
    btnRead.click();
  } else {
    setTimeout(autoClickRSSBook, 500);
  }
}
if (document.location.href.startsWith('https://www.webnovel.com/rssbook/')) {
  autoClickRSSBook();
}
