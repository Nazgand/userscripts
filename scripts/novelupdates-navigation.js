// ==UserScript==
// @name        NovelUpdates Series Navigation
// @namespace   novelupdates.series
// @version     2
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

function getPageCheck(pageNumber) {
  return new Promise(function(resolve, reject) {
    if (typeof pageNumber !== 'number') {
      throw new Error('pageNumber must be number');
    }
    if (isNaN(pageNumber) || Math.floor(pageNumber) !== Math.ceil(pageNumber)) {
      throw new Error('invalid page number');
    }

    if (pageNumber === getCurrentPageNumber()) {
      resolve(document.querySelector('input[checked="checked"]'));
      return;
    }

    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      const { response } = this;
      return resolve(response.querySelector('input[checked="checked"]'));
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
    const lastPageNumber = getLastPageNumber();

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

        return getPageCheck(pageNumber).then(function(check) {
          if (check === null) {
            return;
          }

          statusPage = pageNumber;

          console.log('Found');
        });
      });
    }

    promise = search(currentPageNumber);
    for (let i = 1; i <= lastPageNumber; i++) {
      if (i === currentPageNumber) {
        continue;
      }

      promise = search(i);
    }

    promise.then(function() {
      return resolve(statusPage);
    }).catch(function(err) {
      return reject(err);
    });
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

function main() {
  return Promise.resolve(findCheckedPage()).then(function(page) {
    if (!page) {
      return;
    }

    const currentPageNumber = getCurrentPageNumber();
    if (page !== currentPageNumber) {
      addLinkToPage(page);
    }
  }).catch(function(err) {
    console.error(err.message);
  });
}

if (isLoggedIn()) {
  main();
}
