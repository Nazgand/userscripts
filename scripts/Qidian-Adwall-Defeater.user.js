// ==UserScript==
// @name         Qidian Adwall Defeater
// @namespace    whatever
// @version      8
// @description  passes adwall
// @author       <nazgand@gmail.com>
// @match        https://*.webnovel.com/book/*
// @match        https://*.webnovel.com/rssbook/*
// @grant        none
// @homepage     https://github.com/nazgand/userscripts
// ==/UserScript==

//Suggested use: with Google Chrome AutoMute Extension


//Begin Config

//Buy chapters with spirit stones if possible
const SPEND_STONES = true;

/* Watch ads while reading 1st chapter. Only available on computer, as would be
annoying on mobile. If you use mobile, rumor has it you should be using a
certain version of a certain app which would be better. *wink* */
const SPEND_STONES_ONLY1CHAPTER = true;

//End Config

let previousBtnCost = 'YetToSpend';

function autoClickBook() {
  const btnCheckIn = document.querySelector('a.j_check_in');
  if (btnCheckIn !== null) {
    btnCheckIn.click();
  }
  autoClickBookPlay();
}
function autoClickBookPlay() {
  let canSpend = true;
  const LOGGED_IN = (document.querySelector('a.j_login') === null);
  if (SPEND_STONES && LOGGED_IN) {
    const btnCost = document.querySelector('a.bt._cost');
    if (btnCost === null || btnCost === previousBtnCost
        || (SPEND_STONES_ONLY1CHAPTER && previousBtnCost != 'YetToSpend')) {
      canSpend = false;
    } else {
      previousBtnCost = btnCost;
      btnCost.click();
      setTimeout(autoClickBookPlay, 999);
    }
  }
  if (!(SPEND_STONES && LOGGED_IN && canSpend)) {
    const btnPlay = document.querySelector('a.bt._play');
    if (btnPlay === null) {
      const divLockVideo = document.querySelector('div.lock-video');
      const pContinued = document.querySelector('p.cha-ft[id="continued"]');
      if (pContinued === null || divLockVideo !== null) {
        setTimeout(autoClickBookPlay, 1000);
      }
    } else {
      btnPlay.click();
      setTimeout(autoClickBookSkip, 4000);
    }
  }
}
function autoClickBookSkip() {
  const btnSkip = document.querySelector('a.bt._skip.j_can_skip');
  if (btnSkip === null) {
    setTimeout(autoClickBookSkip, 1000);
  } else {
    btnSkip.click();
    setTimeout(autoClickBookPlay, 2000);
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

//Mobile
function autoClickBookMobile() {
  const btnCheckIn = document.querySelector('a.j_checkinSwitch');
  if (btnCheckIn !== null && !btnCheckIn.classList.contains('_checked')) {
    btnCheckIn.click();
  }
  autoClickBookPlayMobile();
}
let playedAd = false;
let verticalScroll = null;
function autoClickBookResetScrollMobile() {
  window.scrollTo(0, verticalScroll);
}
function autoClickBookPlayMobile() {
  let canSpend = true;
  const LOGGED_IN = (document.querySelector('a.j_signIn') === null);
  if (SPEND_STONES && LOGGED_IN) {
    const btnCost = document.querySelector('a.g_bt.j_costSS');
    if (btnCost === null || btnCost === previousBtnCost) {
      canSpend = false;
    } else {
      previousBtnCost = btnCost;
      btnCost.click();
      setTimeout(autoClickBookPlayMobile, 999);
    }
  }
  if (!(SPEND_STONES && LOGGED_IN && canSpend)) {
    const btnPlay = document.querySelector('a.j_watchAd');
    if (btnPlay === null) {
      const tapNextChapter = document.querySelector('div.swipe-up');
      if (tapNextChapter !== null
          && tapNextChapter.innerHTML === 'Tap to read the next chapter'
          && tapNextChapter.style.cssText === '') {
        if (playedAd) {
          tapNextChapter.click();
        }
        setTimeout(autoClickBookPlayMobile, 1000);
      } else if (verticalScroll !== null) {
        setTimeout(autoClickBookResetScrollMobile, 1000);
      }
    } else {
      if (!playedAd) {
        verticalScroll = window.scrollY;
      }
      playedAd = true;
      btnPlay.click();
      setTimeout(autoClickBookSkipMobile, 4000);
    }
  }
}
function autoClickBookSkipMobile() {
  const btnSkip = document.querySelector('button._skip');
  if (btnSkip === null) {
    setTimeout(autoClickBookPlayMobile, 2000);
  } else {
    if (btnSkip.classList.contains('j_can_skip')) {
      btnSkip.click();
    }
    setTimeout(autoClickBookSkipMobile, 1000);
  }
}
if (document.location.href.startsWith('https://m.webnovel.com/book/')) {
  setTimeout(autoClickBookMobile, 500);
}

function autoClickRSSBookMobile() {
  const btnRead = document.querySelector('a[title="Continue Reading"]');
  if (btnRead !== null) {
    document.location.href = btnRead.href;
  }
}
if (document.location.href.startsWith('https://m.webnovel.com/rssbook/')) {
  autoClickRSSBookMobile();
}
