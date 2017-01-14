// ==UserScript==
// @name        NovelUpdates Series Navigation
// @namespace   novelupdates.series
// @version     3
// @include     http://www.novelupdates.com/series/*
// @include     https://www.novelupdates.com/series/*
// @grant       none
// ==/UserScript==

function isLoggedIn() {
  return !document.querySelector('[href*="/login"]');
}

function getLastPageNumber() {
  const paginationLinks = Array.from(
    document.querySelectorAll('.digg_pagination a')
  );

  const pageNumbers = paginationLinks.map(function(el) {
    return parseInt(el.textContent, 10);
  }).filter(function(n) {
    return !isNaN(n);
  }).sort(function(a, b) {
    return a - b;
  });

  const lastPageNumber = pageNumbers.pop() || null;

  return lastPageNumber;
}

function getCurrentPageNumber() {
  const currentPageWrapper = document.querySelector(
    '.digg_pagination .current'
  );
  if (!currentPageWrapper) {
    throw new Error('could not find current page wrapper');
  }

  const currentPageNumber = parseInt(currentPageWrapper.textContent, 10);
  if (isNaN(currentPageNumber)) {
    throw new Error('could not find current page number');
  }

  return currentPageNumber;
}

function getLessEqualGreatDocument(document) {
  if(document.querySelector('tr[class^="colorme"]')!==null){
    return 0;
  }else if(document.querySelector('tr[class^="newcolorme"]')!==null){
    return -1;
  }else if(document.querySelector('tr[class^="readcolor"]')!==null){
    return 1;
  }
  console.log("wtf error");
  return 2;
}

function getPageLessEqualGreat(pageNumber) {
  return new Promise(function(resolve, reject) {
    if (typeof pageNumber !== 'number') {
      throw new Error('pageNumber must be number');
    }
    if (isNaN(pageNumber) || Math.floor(pageNumber) !== Math.ceil(pageNumber)) {
      throw new Error('invalid page number');
    }

    if (pageNumber === getCurrentPageNumber()) {
      resolve(getLessEqualGreatDocument(document));
      return;
    }

    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      const { response } = this;
      return resolve(getLessEqualGreatDocument(response));
    };

    xhr.onerror = function() {
      const err = new Error('could not load page ' + pageNumber);

      return reject(err);
    };

    xhr.open('GET', window.location.pathname + '?pg=' + pageNumber);
    xhr.responseType = 'document';

    xhr.send();
  });
}

function findCheckedPage() {
  return new Promise(function(resolve, reject) {

    const currentPageNumber = getCurrentPageNumber();
    var minPageNumber = 1;
    var maxPageNumber = getLastPageNumber();

    let statusPage = null;

    let promise = Promise.resolve(null);

    function search(pageNumber) {
      return promise.then(function() {
        if (statusPage !== null) {
          return null;
        }

        if (pageNumber === currentPageNumber) {
          console.log('Looking in current page');
        } else {
          console.log('Looking in page ' + pageNumber);
        }

        return getPageLessEqualGreat(pageNumber).then(function(leg) {
          if (leg == -1) {
            minPageNumber=pageNumber+1;
          }else if (leg == 1) {
            maxPageNumber=pageNumber-1;
          }else{
            statusPage = pageNumber;
            console.log('Found');
            if (statusPage !== currentPageNumber) {
              addLinkToPage(statusPage);
            }
          }
          if(statusPage === null && minPageNumber<=maxPageNumber){
            promise = search(Math.floor((minPageNumber+maxPageNumber)/2));
          }
        });
      });
    }

    search(currentPageNumber);
  });
}

function addLinkToPage(page) {
  const table = document.getElementById('myTable');
  if (!table) {
    throw new Error('could not find chapters table');
  }

  const heading = table.previousElementSibling;
  if (heading.tagName.toLowerCase() !== 'h4') {
    throw new Error('invalid table heading');
  }

  const a = document.createElement('a');
  a.textContent = 'Go to page ' + page;
  a.href = window.location.pathname + '?pg=' + page;

  const small = document.createElement('small');
  small.style.float = 'right';

  small.appendChild(a);
  heading.appendChild(small);
}

if (isLoggedIn()) {
  findCheckedPage();
}
