// ==UserScript==
// @name        Novel Updates Cover Preview
// @namespace   https://github.com/nazgand/userscripts
// @version     0.0.0
// @description Add cover previews when hovering over links to novels.
// @match       https://*.novelupdates.com/*
// @match       http://*.novelupdates.com/*
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// ==/UserScript==
//
// Originally from:
//
//     https://greasyfork.org/scripts/26439-novelupdates-cover-preview/

const DEFAULT_TTL = 24 * 60 * 60 * 1000;
const IMAGES = {};

main();

function main() {
  const links = getNovelLinks();
  if (!links.length) {
    return;
  }

  loadStyles();

  const novelUrlList = links.map(function(el) {
    return el.href;
  }).filter(function(url, i, arr) {
    return arr.indexOf(url) === i;
  }).sort();

  initializeImages(novelUrlList)
    .catch(function(err) {
      console.error(err.message);
    });

  links.forEach(function(link) {
    initializeLink(link);
  });
}

function getNovelLinks() {
  const links = Array.from(
    document.querySelectorAll('a[href*="/series/"]')
  );

  return links;
}

function loadStyles() {
  GM_addStyle(`
    [data-userscript-cover] {
      position: absolute;
      height: 1.5em;
    }

    :hover + [data-userscript-cover]::before {
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 7px solid #333;
      bottom: 100%;
      content: '';
      display: block;
      height: 0;
      right: 10px;
      position: absolute;
      transform: translateY(-3px);
      width: 0;
      z-index: 1000;
    }

    :hover + [data-userscript-cover]::after {
      background-position: 50% 50%;
      background-repeat: no-repeat;
      background-size: cover;
      border: 2px solid #333;
      bottom: 100%;
      content: '';
      display: block;
      height: 175px;
      right: 0;
      position: absolute;
      transform: translateY(-10px);
      width: 124px;
      z-index: 1000;
    }

    :hover + [data-userscript-cover].userscript-cover-below::before {
      border-bottom: 7px solid #333;
      border-top: initial;
      bottom: initial;
      top: 100%;
      transform: translateY(3px);
    }

    :hover + [data-userscript-cover].userscript-cover-below::after {
      bottom: initial;
      top: 100%;
      transform: translateY(10px);
    }
  `);
}

function initializeImages(novelUrlList) {
  novelUrlList.forEach(function(novelUrl) {
    IMAGES[novelUrl] = getNovelCoverImageUrl(novelUrl)
      .then(loadImage);
  });

  const promises = Object.keys(IMAGES).map(function(key) {
    return IMAGES[key];
  });

  return Promise.all(promises);
}

function initializeLink(element) {
  const alternativeClass = 'userscript-cover-below';

  const { href } = element;

  return IMAGES[href].then(function(imageUrl) {
    const cover = document.createElement('span');

    element.insertAdjacentElement('afterend', cover);

    cover.dataset.userscriptCover = imageUrl;

    element.addEventListener('mouseenter', function() {
      const { top } = element.getBoundingClientRect();

      if (top > 175) {
        cover.classList.remove(alternativeClass);

        return;
      }

      cover.classList.add(alternativeClass);
    });
  });
}

function getNovelCoverImageUrl(novelUrl) {
  const cachedImageUrl = getImageFromCache(novelUrl);
  if (cachedImageUrl) {
    return Promise.resolve(cachedImageUrl);
  }

  return new Promise(function(resolve, reject) {
    function onload(response) {
      const { responseText } = response;

      const parser = new DOMParser();
      const document = parser.parseFromString(responseText, 'text/html');

      const img = document.querySelector('.seriesimg img');
      if (!img) {
        const err = new Error('could not find series image');

        return reject(err);
      }

      const imageUrl = img.getAttribute('src');
      if (!imageUrl) {
        const err = new Error('image doesn\'t have a valid url');

        return reject(err);
      }

      return resolve(imageUrl);
    }

    function onerror() {
      const err = new Error('could not load ' + novelUrl);

      return reject(err);
    }

    GM_xmlhttpRequest({
      url: novelUrl,
      method: 'GET',

      onload,
      onerror,
    });
  }).then(function(imageUrl) {
    const coverData = {
      url: imageUrl,
      expiresAt: Date.now() + DEFAULT_TTL,
    };

    GM_setValue(novelUrl, JSON.stringify(coverData));

    return imageUrl;
  });
}

function getImageFromCache(novelUrl) {
  const rawCover = GM_getValue(novelUrl, null);
  if (!rawCover) {
    return null;
  }

  const coverData = JSON.parse(rawCover);
  if (Date.now() > coverData.expiresAt) {
    GM_deleteValue(novelUrl);

    return null;
  }

  const imageUrl = coverData.url;

  return imageUrl;
}

function loadImage(imageUrl) {
  return new Promise(function(resolve) {
    const img = new Image();

    img.onload = function() {
      GM_addStyle(`
        [data-userscript-cover="${imageUrl}"]::after {
          background-image: url(${imageUrl});
        }
      `);

      return resolve(imageUrl);
    };

    img.onerror = function() {
      return setTimeout(function() {
        return loadImage(imageUrl).then(resolve);
      }, 1000);
    };

    img.src = imageUrl;
  });
}
