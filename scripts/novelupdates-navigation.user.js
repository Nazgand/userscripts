// ==UserScript==
// @name        Novel Updates Navigation
// @namespace   https://github.com/noisypixy/userscripts
// @version     0.0.1
// @grant       none
// @match       http://www.novelupdates.com/series/*
// @match       https://www.novelupdates.com/series/*
// ==/UserScript==

/**
 * @returns {Boolean} Whether the user is logged in or not.
 */
function isLoggedIn() {
  return !document.querySelector('[href*="/login"]');
}

/**
 * @returns {Number} Last page.
 */
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
  if (lastPageNumber === null) {
    throw new Error('could not find last page number');
  }

  return lastPageNumber;
}

/**
 * @returns {Number} Current page.
 */
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

/**
 * @param {Document} document Where to look for the checked element.
 * @returns {Number} -1 if the checked element is in a previous pages,
 *                   1 if it's in the next pages, or 0 if it's in the given
 *                   document.
 */
function getCheckedElementDirection(document) {
  if (document instanceof Document !== true) {
    throw new Error('document must be instance of Document');
  }

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

/**
 * @param {Number} pageNumber Page number.
 * @returns {Promise} A promise that resolves to the direction of the
 *                    page that contains the latest release read by
 *                    the user.
 */
function getStatusPageDirection(pageNumber) {
  return new Promise(function(resolve, reject) {
    if (!Number.isInteger(pageNumber)) {
      throw new Error('pageNumber must be integer');
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

/**
 * Look for the page with the latest read release, using a recursive
 * binary search.
 *
 * This will only search within the closed interval [firstPage, lastPage].
 *
 * @param {Number} firstPage Lower bound for the search.
 * @param {Number} lastPage Upper bound for the search.
 * @returns {Promise} A promise that resolves to a page number.
 */
function findCheckedPage(firstPage = 1, lastPage = getLastPageNumber()) {
  if (!Number.isInteger(firstPage)) {
    throw new Error('firstPage must be integer');
  }
  if (!Number.isInteger(lastPage)) {
    throw new Error('lastPage must be integer');
  }
  if (firstPage > lastPage) {
    throw new Error('firstPage must be less than or equal to lastPage');
  }
  if (firstPage <= 0) {
    throw new Error('firstPage must be greater than 0');
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

/**
 * Add a link pointing to the given page.
 *
 * @param {Number} page Page where the link will point to.
 * @returns {undefined}
 */
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

/**
 * The entry point of the user script.
 *
 * @returns {undefined}
 */
function main() {
  findCheckedPage()
    .then(function(page) {
      const currentPageNumber = getCurrentPageNumber();

      if (page !== currentPageNumber) {
        addLinkToPage(page);
      }
    })
    .catch(function(err) {
      console.error(err.message);
    });
}

if (isLoggedIn()) {
  main();
}
