// ==UserScript==
// @name        NovelUpdates Series Navigation
// @namespace   novelupdates.series
// @version     1
// @include     http://www.novelupdates.com/series/*
// @include     https://www.novelupdates.com/series/*
// @grant       none
// ==/UserScript==

function isLoggedIn() {
  return !document.querySelector('[href*="/login"]');
}

function getSeriesUrl() {
  const link = document.querySelector('[rel="canonical"]');
  const { href } = link;

  return href;
}

function getSlug() {
  const seriesUrl = getSeriesUrl();

  const m = seriesUrl.match(/series\/([^/+]+)/);
  if (!m) {
    return null;
  }

  const slug = m[1];

  return slug;
}

function getStatus(slug) {
  return new Promise(function(resolve, reject) {
    if (typeof slug !== 'string') {
      throw new Error('slug must be text');
    }

    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      const { response } = this;

      const seriesLink = response.querySelector(
        '.rl_links a[href*="' + slug + '"]'
      );
      if (!seriesLink) {
        return resolve(null);
      }

      const statusContainer = seriesLink
        .closest('.rl_links')
        .querySelector('.chp-release');

      if (!statusContainer) {
        const err = new Error('could not get series status');

        return reject(err);
      }

      const status = statusContainer.textContent.trim();
      if (!status) {
        const err = new Error('invalid status');

        return reject(err);
      }

      return resolve(status);
    };

    xhr.onerror = function() {
      const err = new Error('could not retrieve status');

      return reject(err);
    };

    xhr.open('GET', '/reading-list/');
    xhr.responseType = 'document';

    console.log('Getting status from user\'s reading list');

    xhr.send();
  });
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

function getChaptersFromDocument(document) {
  const chapters = Array.from(
    document.querySelectorAll('.chp-release')
  ).map(function(el) {
    return el.textContent.trim();
  });

  return chapters;
}

function getPageChapters(pageNumber) {
  return new Promise(function(resolve, reject) {
    if (typeof pageNumber !== 'number') {
      throw new Error('pageNumber must be number');
    }
    if (isNaN(pageNumber) || Math.floor(pageNumber) !== Math.ceil(pageNumber)) {
      throw new Error('invalid page number');
    }

    const currentPageNumber = getCurrentPageNumber();
    if (pageNumber === currentPageNumber) {
      const chapters = getChaptersFromDocument(document);

      resolve(chapters);

      return;
    }

    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      const { response } = this;

      const chapters = getChaptersFromDocument(response);

      return resolve(chapters);
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

function findStatusPage(status) {
  return new Promise(function(resolve, reject) {
    if (typeof status !== 'string') {
      throw new Error('status must be string');
    }

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

        return getPageChapters(pageNumber).then(function(chapters) {
          if (chapters.indexOf(status) === -1) {
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
  const slug = getSlug();

  return getStatus(slug).then(function(status) {
    if (!status) {
      console.log('Status not found. Ignoring.');

      return null;
    }

    console.log('Current status: ' + status);

    return findStatusPage(status);
  }).then(function(page) {
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
