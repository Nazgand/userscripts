// ==UserScript==
// @name        NovelUpdates Series Navigation
// @namespace   https://github.com/noisypixy/userscripts
// @version     0
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

function getCheckedElementDirection(document) {
  const table = document.getElementById('myTable');
  if (!table) {
    throw new Error('could not find chapters table');
  }

  const checkbox = table.querySelector('[checked]');
  if (checkbox) {
    return 0;
  }

  const read = table.querySelector('tr.readcolor');
  if (!read) {
    return 1;
  }

  return -1;
}

function getStatusPageDirection(pageNumber) {
  return new Promise(function(resolve, reject) {
    if (typeof pageNumber !== 'number') {
      throw new Error('pageNumber must be number');
    }
    if (isNaN(pageNumber) || Math.floor(pageNumber) !== Math.ceil(pageNumber)) {
      throw new Error('invalid page number');
    }

    if (pageNumber === getCurrentPageNumber()) {
      const direction = getCheckedElementDirection(document);

      resolve(direction);

      return;
    }

    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      const { response } = this;

      const direction = getCheckedElementDirection(response);

      return resolve(direction);
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

function findCheckedPage(firstPage = 1, lastPage = getLastPageNumber()) {
  if (typeof firstPage !== 'number' || isNaN(firstPage)) {
    throw new Error('firstPage must be number');
  }
  if (typeof lastPage !== 'number' || isNaN(lastPage)) {
    throw new Error('lastPage must be number');
  }
  if (firstPage > lastPage) {
    throw new Error('firstPage must be less than or equal to lastPage');
  }
  if (firstPage < 1) {
    throw new Error('firstPage must be greater than 0');
  }
  if (Math.floor(firstPage) !== Math.ceil(firstPage)) {
    throw new Error('firstPage must be int');
  }
  if (Math.floor(lastPage) !== Math.ceil(lastPage)) {
    throw new Error('lastPage must be int');
  }

  const pageNumber = firstPage + Math.floor((lastPage - firstPage) / 2);

  const currentPageNumber = getCurrentPageNumber();

  if (pageNumber === currentPageNumber) {
    console.log('Looking in current page');
  } else {
    console.log('Looking in page ' + pageNumber);
  }

  return getStatusPageDirection(pageNumber).then(function(direction) {
    if (direction === 0) {
      console.log('Found');

      return pageNumber;
    }

    if (direction === -1) {
      lastPage = pageNumber - 1;
    } else if (direction === 1) {
      firstPage = pageNumber + 1;
    }

    return findCheckedPage(firstPage, lastPage);
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
  findCheckedPage()
    .then(addLinkToPage)
    .catch(function(err) {
      console.error(err.message);
    });
}

if (isLoggedIn()) {
  main();
}
