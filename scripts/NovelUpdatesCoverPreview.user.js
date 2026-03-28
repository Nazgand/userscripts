// ==UserScript==
// @name        Novel Updates Cover Preview
// @namespace   Nazgand.NovelUpdates
// @version     3
// @description Previews cover image when hovering over hyperlinks that lead to Novel Updates series pages & some other pages. Forked from [The Original Version Made By SZ] (https://greasyfork.org/en/scripts/26439-novelupdates-cover-preview).
// @author      Nazgand
// @supportURL  Https://GitHub.Com/Nazgand/UserScripts/discussions
// @website     Https://GitHub.Com/Nazgand/UserScripts/
// @include     /^https?:\/\/(.*\.)?(novelupdates|scribblehub)(forum)?\.com/
// @include     /^https?:\/\/(.*\.)?(royalroad|webnovel|mangaupdates)\.com/
// @include     /^https?:\/\/(.*\.)?(mydramalist|imdb|wiki\.d\-addicts|asianwiki|tvmaze)\.com/
// @include     /^https?:\/\/(.*\.)?mangadex\.org/
// @include     file:///*/TestNovelUpdatesCoverPreview.html
// @connect     novelupdates.com
// @connect     scribblehub.com
// @connect     royalroad.com
// @connect     webnovel.com
// @connect     mangaupdates.com
// @connect     mydramalist.com
// @connect     imdb.com
// @connect     wiki.d-addicts.com
// @connect     asianwiki.com
// @connect     tvmaze.com
// @connect     mangadex.org
// @grant       GM.xmlHttpRequest
// @grant       GM.addStyle
// @grant       GM.setValue
// @grant       GM.getValue
// @grant       GM.deleteValue
// @grant       GM.listValues
// @run-at      document-end
// @license     http://creativecommons.org/licenses/by-nc-sa/4.0/
// @downloadURL Https://GitHub.Com/Nazgand/UserScripts/raw/master/scripts/NovelUpdatesCoverPreview.user.js
// @updateURL   https://update.greasyfork.org/scripts/571289/Novel%20Updates%20Cover%20Preview.meta.js
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAnCAIAAAADwcZiAAAAAXNSR0IB2cksfwAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAADJJREFUWMPtzTEBACAIADAkEQnoYf8itMDDrcBO9Y11GS9YrVar1Wq1Wq1Wq9Vqtf61DsefARWoUNJVAAAAAElFTkSuQmCC
// ==/UserScript==
(function () {
	"use strict";
	// User Settings
	const UpdateAtCacheAge = 39 ** 6; // Minimum Age of Cached data in milliseconds required to send an HTTP request to check whether the cache should be updated. Ignored if the cached data is missing or corrupt.
	let EnablePreloader = true;
	const MaximumTotalPreloads = 15;
	const MaximumSitePreloads = 5;
	const PreloadDelayMs = 398;
	const color = {
		'Background': '#303e59',
		'Text': '#607cb2',
		'Border': '#00ff00',
		'Link': '#ffff00',
		'Important': '#ff00ff',
	};
	const defaultShowIconNextToLink = false;
	let useReadingListIconAndTitle = true;
	// END User Settings

	const eventListenerStyle = 0; //undefined/0 forEach seriesLink addeventlistener(mouseenter/mouseleave) / 1 window addeventlistener(mousemove)
	const version = "3";
	const forceUpdate = false;
	const PREDEFINED_NATIVE_TITLE = "Recommended by";
	const targetContainerIDArrayToObserve = [
		"profile_content3",
		"messageList",
		"myTable",
	];
	const NU_REGEX = "^https?://(?:www\\.)?novelupdates\\.com/series/([\\w-]+)";
	const MD_REGEX = "^https?://(?:www\\.)?mangadex\\.org/(?:title|manga)/([^/\\s]+)";
	const TV_REGEX = "^https?://(?:www\\.)?tvmaze\\.com/shows/(\\d+)";
	const SH_REGEX = "^https?://(?:www\\.)?scribblehub\\.com/series/(\\d+)";
	const WN_REGEX = "^https?://(?:www\\.|m\\.)?webnovel\\.com/book/([\\w'-]+)";
	const RR_REGEX = "^https?://(?:www\\.)?royalroadl?\\.com/fiction/(\\d+)";
	const MU_REGEX = "^https?://(?:www\\.)?mangaupdates\\.com/series/(\\w{5,})";
	const MDL_REGEX = "^https?://(?:www\\.)?mydramalist\\.com/(\\d+-[\\w-]+)";
	const IMDB_REGEX = "^https?://(?:www\\.)?imdb\\.com/title/(tt\\d+)";
	const WIKI_REGEX = "^https?://(?:www\\.)?wiki\\.d-addicts\\.com/([\\w\\.\\:()-]+)";
	const AW_REGEX = "^https?://(?:www\\.)?asianwiki\\.com/(?!Category\\:)([\\w\\.\\:()-]+)";
	var linkConfigs = {
		[NU_REGEX]: {
			idPrefix: "nu_",
			searchString: "novelupdates.com/series/",
			targetDomain: "novelupdates.com",
			seriesPageTitle: ".seriestitlenu",
			seriesImage: ".serieseditimg img, .seriesimg img",
			seriesPageVotes: ".seriesother > .uvotes",
			seriesPageStatus: "#editstatus",
			seriesPageGenre: "#seriesgenre",
			seriesPageTags: "#showtags",
			seriesPageDescription: "#editdescription",
			seriesAlternativeNames: "#editassociated",
			seriesReadingListIcon: ".sticon img",
			seriesReadingListTitle: ".sttitle > a",
		},
		[MD_REGEX]: {
			idPrefix: "md_",
			searchString: "mangadex.org/",
			targetDomain: "mangadex.org",
			mainAPI: "https://api.mangadex.org/",
		},
		[TV_REGEX]: {
			idPrefix: "tv_",
			searchString: "tvmaze.com/shows/",
			targetDomain: "tvmaze.com",
			mainAPI: "https://api.tvmaze.com/shows/",
		},
		[SH_REGEX]: {
			idPrefix: "sh_",
			searchString: "scribblehub.com/series/",
			targetDomain: "scribblehub.com",
			seriesImage: ".fic_image img",
			seriesPageTitle: ".fic_title",
			seriesPageVotes: "#ratefic_user > span",
			seriesPageStatus: ".fic_stats > span:nth-child(3)",
			seriesPageGenre: ".wi_fic_genre",
			seriesPageTags: ".wi_fic_showtags_inner",
			seriesPageDescription: ".wi_fic_desc",
			seriesReadingListTitle: ".tip_icon.lib .tip_title.lib",
		},
		[WN_REGEX]: {
			idPrefix: "wn_",
			searchString: "webnovel.com/book/",
			targetDomain: "webnovel.com",
			seriesImage: ".g_thumb > img",
			seriesPageTitle: ".det-info h1",
			seriesPageVotes: "._score > strong",
			seriesPageStatus: ".det-hd-detail > strong > span",
			seriesPageGenre: ".det-hd-detail > a > span",
			seriesPageTags: ".m-tags",
			seriesPageDescription: ".det-abt > div > p",
		},
		[RR_REGEX]: {
			idPrefix: "rr_",
			selectorKeywords: ["royalroad.com/fiction/", "royalroadl.com/fiction/"],
			searchString: "fiction/",
			targetDomain: "royalroad.com",
			seriesImage: "div.cover-art-container > img",
			seriesPageTitle: ".fic-title h1",
			seriesPageVotes: undefined,
			seriesPageStatus: ".fiction-info > div > div:nth-child(2) > div > span:nth-child(2)",
			seriesPageGenre: ".tags",
			seriesPageTags: undefined,
			seriesPageDescription: ".description",
		},
		[MU_REGEX]: {
			idPrefix: "mu_",
			searchString: "mangaupdates.com/series/",
			targetDomain: "mangaupdates.com",
			seriesImage: "img[src*=\"cdn.mangaupdates.com/image/\"]",
			seriesPageTitle: ".releasestitle",
			seriesPageVotes: ':nth-child(5 of div.info-box-module__gIhiNW__sContent[data-cy="info-box-unknown"])',
			seriesPageDescription: "[data-cy=\"info-box-description\"]",
			seriesReadingListTitle: "div#showList > div > a > u",
			seriesPageStatus: "[data-cy=\"info-box-status\"]",
			seriesPageGenre: '[data-cy="info-box-genres"]',
			seriesPageTags: "[data-cy=\"info-box-categories\"] .tag-cloud-display-module-scss-module__9_h3Gq__tags ul",
		},
		[MDL_REGEX]: {
			idPrefix: "mdl_",
			searchString: "mydramalist.com/",
			targetDomain: "mydramalist.com",
			seriesPageTitle: ".film-title",
			seriesAlternativeNames: ".mdl-aka-titles",
			seriesImage: ".film-cover img",
			seriesPageVotes: "#show-detailsxx .hfs",
			seriesPageStatus: ".content-side > div:nth-child(2) > div:nth-child(2) li:nth-child(4)",
			seriesPageGenre: ".show-genres",
			seriesPageTags: ".show-tags",
			seriesPageDescription: ".show-synopsis",
		},
		[IMDB_REGEX]: {
			idPrefix: "imdb_",
			searchString: "imdb.com/title/",
			targetDomain: "imdb.com",
			seriesPageTitle: "h1 span.hero__primary-text",
			seriesImage: ".ipc-poster img",
			seriesPageVotes: 'div[data-testid="hero-rating-bar__aggregate-rating__score"]',
			seriesPageStatus: 'a.ipc-link[href*="/releaseinfo/"]',
			seriesPageTags: '[data-testid="interests"] > .ipc-chip-list__scroller',
			seriesPageDescription: 'p[data-testid="plot"] > span > span > span',
		},
		[WIKI_REGEX]: {
			idPrefix: "wiki_",
			searchString: "wiki.d-addicts.com/",
			targetDomain: "wiki.d-addicts.com",
			seriesPageTitle: "#content .title",
			seriesAlternativeNames: "#mw-content-text > .mw-parser-output > ul > li:nth-child(1)",
			seriesImage: ".thumbinner img",
			seriesPageVotes: ".voteboxrate",
			seriesPageStatus: '#mw-content-text > .mw-parser-output > ul > li:nth-last-child(3)',
			seriesPageChapters: '#mw-content-text > .mw-parser-output > ul > li:nth-last-child(5)',
			seriesPageGenre: "#mw-content-text > .mw-parser-output > ul > li:nth-last-child(6)",
			seriesPageDescription: "#mw-content-text p",
		},
		[AW_REGEX]: {
			idPrefix: "aw_",
			searchString: "asianwiki.com/",
			targetDomain: "asianwiki.com",
			seriesPageTitle: ".article > h1",
			seriesAlternativeNames: "#mw-content-text > ul > li:nth-child(2)",
			seriesImage: ".thumbimage",
			seriesPageVotes: "#w4g_rb_area-1",
			seriesPageStatus: "#mw-content-text > ul > li:nth-child(8)",
			seriesPageChapters: "#mw-content-text > ul > li:nth-child(7)", // fails for movies
			seriesPageGenre: '#mw-content-text > ul > li:has(a[title*="Category"])',
			seriesPageDescription: "#mw-content-text > ul ~ p", //next p sibling after ul
		},
	};
	const linkConfigKeys = Object.keys(linkConfigs);
	const settingsToKeepOnDataReset = [
		"showDescription",
		"showDetails",
		"showSmaller",
		"useReadingListIconAndTitle",
		"showIconNextToLink",
	];
	let showIconNextToLink = defaultShowIconNextToLink;
	const linkIconEnum = {
		popupPossibleNotLoadedOrMarkedForPreloading: 1,
		popupMarkedForPreloading: 2,
		popupLoading: 3,
		popupHasCoverData: 4,
		error: 5,
	};
	Object.freeze(linkIconEnum);
	const emptyCoverData = {
		url: undefined,
		title: undefined,
		alternativeNames: undefined,
		votes: undefined,
		status: undefined,
		chapters: undefined,
		genre: undefined,
		Tags: undefined,
		description: undefined,
		NovelDomain: undefined,
		readingListIcon: undefined,
		readingListTitle: undefined,
	};
	let Preloads = {
		'AllSites': {
			Completed: 0,
			InProgress: 0,
		}
	};
	let ignorePreloaderBudget = false;
	let preloadedUrlSet = new Set();
	const reSpace = /\s*,\s*/; //Regex for split and remove empty spaces
	const reChapters = new RegExp("([0-9.]+)[ ]*(wn)?[ ]*chapters");
	const reChaptersNumberBehind = new RegExp("chapter[s]?[ ]*[(]?[ ]*([0-9.]+)");
	const reChaptersOnlyNumbers = new RegExp("([0-9.]+)");
	const reRating = new RegExp("([0-9.]+) / ([0-9.]+)");
	const reRatingSingleNumber = new RegExp("([0-9.]+)");
	const reVoteCount = new RegExp("([0-9.]+)[ ]*(votes|ratings|users)");
	const defaultHeight = 400; //in pixel
	const smallHeight = 251;
	const PREDEFINED_NATIVE_TITLE_ARRAY = PREDEFINED_NATIVE_TITLE.split(reSpace);
	let showDetails = true;
	let popupVisible = false; //not all links have a title or text(img link) to set currentTitleHover. Manual state saving needed
	let isPopupFrozen = false;
	let AllSeriesNodes = [];
	let previousTitleHover,
		currentTitleHover,
		currentCoverData,
		currentPopupEvent,
		activeHoverCacheKey;
	let popup, popupTitle, popupContent, LineSVG;
	let lastTarget;
	let lastPopupTarget;
	let showDescription = false;
	let showSmaller = false;
	let showHotkeys = false;
	let showAlternativeNames = false;
	let autoScrollCoverData = true;
	let coverDataContainer = [];
	let mediumTextStyle = "mediumText";
	let smallTextStyle = "smallText";
	let pressedKeys = [];
	const supportsCSSMin = CSS.supports("max-Height", "min(400px, 100%)");
	const config = { attributes: true, childList: true, subtree: true };
	function isCoverDataValid(coverData) {
		if (!coverData || !coverData.title) return false;
		for (let prop in coverData) {
			if (typeof coverData[prop] === "string" && (coverData[prop].includes("⏳ Loading") || coverData[prop].includes("Error loading") || coverData[prop] === "Error")) {
				return false;
			}
		}
		return true;
	}
	async function GM_getCachedValue(key) {
		const novelId = getNovelId(key) || key;
		const rawCover = await GM.getValue(novelId, null);
		let result = null;
		if (rawCover === null || rawCover == "null") {
		} else {
			let coverData;
			try {
				coverData = JSON.parse(rawCover);
				if (coverData.title && coverData.cachedTime) {
					result = {
						url: coverData.url,
						title: coverData.title,
						alternativeNames: coverData.alternativeNames,
						votes: coverData.votes,
						status: coverData.status,
						chapters: coverData.chapters,
						genre: coverData.genre,
						Tags: coverData.Tags,
						description: coverData.description,
						NovelDomain: coverData.NovelDomain,
						readingListIcon: coverData.readingListIcon,
						readingListTitle: coverData.readingListTitle,
						cachedTime: coverData.cachedTime,
						updateStatus: coverData.updateStatus
					};
				}
			} catch (e) {
				await GM.deleteValue(novelId);
			}
		}
		return result;
	}
	async function GM_setCachedValue(key, coverData) {
		const novelId = getNovelId(key) || key;
		const cD = {
			url: coverData.url,
			title: coverData.title,
			alternativeNames: coverData.alternativeNames,
			votes: coverData.votes,
			status: coverData.status,
			chapters: coverData.chapters,
			genre: coverData.genre,
			Tags: coverData.Tags,
			description: coverData.description,
			NovelDomain: coverData.NovelDomain,
			readingListIcon: coverData.readingListIcon,
			readingListTitle: coverData.readingListTitle,
			cachedTime: Date.now(),
		};
		await GM.setValue(novelId, JSON.stringify(cD));
	}
	const debounce = function (func, timeout) {
		let timer;
		return (...args) => {
			const next = () => func(...args);
			if (timer) {
				clearTimeout(timer);
			}
			timer = setTimeout(next, timeout > 0 ? timeout : 300);
		};
	};
	const throttle = function (func, wait = 100) {
		let timer = null;
		return function (...args) {
			if (timer === null) {
				timer = setTimeout(() => {
					func.apply(this, args);
					timer = null;
				}, wait);
			}
		};
	};
	const callbackMutationObserver = function (mutationsList, _) {
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				hidePopUp();
				debouncedPreloadCoverData();
			}
		}
	};
	const mutationObserver = new MutationObserver(callbackMutationObserver);
	const debouncedPreloadCoverData = debounce(preloadCoverData, 100);
	const throttledGetHoveredItem = throttle(getHoveredItem, 50);
	async function checkDataVersion() {
		const dataVersion = await GM.getValue("version", null);
		if (
			dataVersion === null ||
			dataVersion === undefined ||
			dataVersion != version ||
			forceUpdate
		) {
			await resetDatabase();
		}
	}
	async function resetDatabase() {
		const oldValues = await GM.listValues();
		const oldValuesLengthToLoop = oldValues.length;
		for (let i = 0; i < oldValuesLengthToLoop; i++) {
			if (!settingsToKeepOnDataReset.includes(oldValues[i])) {
				await GM.deleteValue(oldValues[i]);
			} else {
			}
		}
		await GM.setValue("version", version);
	}
	function drawLinkToPopupLine(PopupDot, LinkDot) {
		if (!LineSVG) return;
		LineSVG.style.position = "fixed";
		LineSVG.style.left = "0px";
		LineSVG.style.top = "0px";
		LineSVG.style.width = "100%";
		LineSVG.style.height = "100%";
		LineSVG.style.zIndex = 1000;
		LineSVG.style.pointerEvents = "none";

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.style.overflow = "visible";
		svg.style.width = "100%";
		svg.style.height = "100%";
		svg.style.position = "fixed";
		svg.style.top = "0";
		svg.style.left = "0";
		svg.style.pointerEvents = "none";

		const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line.setAttribute("x1", PopupDot.x);
		line.setAttribute("y1", PopupDot.y);
		line.setAttribute("x2", LinkDot.x);
		line.setAttribute("y2", LinkDot.y);
		line.setAttribute("stroke", color["Border"]);
		line.setAttribute("stroke-width", "2");

		svg.appendChild(line);
		LineSVG.innerHTML = "";
		LineSVG.appendChild(svg);
	}
	function getPopupPos(event) {
		const targetElement = event.target;
		let targetRect = targetElement.getBoundingClientRect();
		const img = targetElement.querySelector('img');
		if (img) targetRect = img.getBoundingClientRect();
		const popupRect = popup.getBoundingClientRect();
		const windowMargin = 9;
		const popupGap = 5;
		const viewport = { w: window.innerWidth, h: window.innerHeight };
		const popupDim = { w: popupRect.width, h: popupRect.height };
		const spaceBelow = viewport.h - windowMargin - (targetRect.bottom + popupGap);
		const spaceAbove = targetRect.top - popupGap - windowMargin;
		const spaceRight = viewport.w - windowMargin - (targetRect.right + popupGap);
		const spaceLeft = targetRect.left - popupGap - windowMargin;
		// 1. Try BOTTOM
		if (spaceBelow >= defaultHeight) {
			return {
				Px: Math.max(windowMargin, Math.min(targetRect.left + targetRect.width / 2 - popupDim.w / 2, viewport.w - popupDim.w - windowMargin)),
				Py: targetRect.bottom + popupGap,
				Ph: spaceBelow,
				side: "bottom"
			};
		}
		// 2. Try TOP
		if (spaceAbove >= defaultHeight) {
			return {
				Px: Math.max(windowMargin, Math.min(targetRect.left + targetRect.width / 2 - popupDim.w / 2, viewport.w - popupDim.w - windowMargin)),
				Py_bottom: targetRect.top - popupGap,
				Ph: spaceAbove,
				side: "top"
			};
		}
		// 3. Try RIGHT
		if (spaceRight >= popupDim.w) {
			return {
				Px: targetRect.right + popupGap,
				Py: Math.max(windowMargin, Math.min(targetRect.top + targetRect.height / 2 - popupDim.h / 2, viewport.h - popupDim.h - windowMargin)),
				Ph: viewport.h - windowMargin * 2,
				side: "right"
			};
		}
		// 4. Try LEFT
		if (spaceLeft >= popupDim.w) {
			return {
				Px: targetRect.left - popupDim.w - popupGap,
				Py: Math.max(windowMargin, Math.min(targetRect.top + targetRect.height / 2 - popupDim.h / 2, viewport.h - popupDim.h - windowMargin)),
				Ph: viewport.h - windowMargin * 2,
				side: "left"
			};
		}
		// Fallback: Pick side with most vertical space
		if (spaceBelow >= spaceAbove) {
			return {
				Px: windowMargin,
				Py: targetRect.bottom + popupGap,
				Ph: spaceBelow,
				side: "bottom"
			};
		} else {
			return {
				Px: windowMargin,
				Py_bottom: targetRect.top - popupGap,
				Ph: spaceAbove,
				side: "top"
			};
		}
	}
	function sleep() {
		return new Promise(requestAnimationFrame);
	}
	function applyPopupPositioning(target, event) {
		if (target && event && popupVisible) {
			const posData = getPopupPos(event);
			const viewportH = window.innerHeight;
			popup.style.top = "";
			popup.style.bottom = "";
			popup.style.left = posData.Px + "px";
			popup.style.maxHeight = Math.max(0, posData.Ph) + "px";
			if (posData.side === "top") {
				popup.style.bottom = (viewportH - posData.Py_bottom) + "px";
			} else {
				popup.style.top = posData.Py + "px";
			}
			// Calculate Line
			const curTargetRect = (target.querySelector('img') || target).getBoundingClientRect();
			const popupRect = popup.getBoundingClientRect();
			const linkCenterX = curTargetRect.left + curTargetRect.width / 2;
			const linkCenterY = curTargetRect.top + curTargetRect.height / 2;
			let PopupDotX, PopupDotY;
			if (posData.side === "top" || posData.side === "bottom") {
				PopupDotX = Math.max(posData.Px, Math.min(linkCenterX, posData.Px + popupRect.width));
				PopupDotY = posData.side === "bottom" ? posData.Py : posData.Py_bottom;
			} else {
				PopupDotY = Math.max(posData.Py, Math.min(linkCenterY, posData.Py + popupRect.height));
				PopupDotX = posData.side === "left" ? posData.Px + popupRect.width : posData.Px;
			}
			const LinkDotX = Math.max(curTargetRect.left, Math.min(PopupDotX, curTargetRect.right));
			const LinkDotY = Math.max(curTargetRect.top, Math.min(PopupDotY, curTargetRect.bottom));
			drawLinkToPopupLine({ x: PopupDotX, y: PopupDotY }, { x: LinkDotX, y: LinkDotY });
		}
	}
	async function popupPos(event) {
		if (event && event !== undefined) {
			const target = event.target;
			showPopUp();
			await sleep();
			await sleep();
			applyPopupPositioning(target, event);
			autoScrollData();
			autoScrollData("coverPreviewContentAutoScroll");
		}
	}
	function tryToGetTextContent(element, targetDomain) {
		function tryToGetTextContentRecursive(element) {
			function inside() {
				return Array.from(element.childNodes).map(child => tryToGetTextContentRecursive(child)).join(' ');
			}
			if (element.tagName) {
				const tn = element.tagName.toLowerCase();
				switch (tn) {
					case 'br':
						return '<br>';
					case 'a':
						return '<a href="' + element.href.replace(/^file:\/\//, 'https://' + targetDomain) +
							'" title="' + element.title + '"><span class="InlineBlock">〘' +
							inside().replace(/\s*#/g, '').trim() + '〙</span></a>';
					case 'u':
					case 'p':
					case 'i':
					case 'b':
						const StripUPIB = ["m-tag" /* webnovel.com <p> */];
						if (StripUPIB.some(className =>
							element.classList.contains(className)
						)) {
							break;
						}
						return '<' + tn + '>' + inside() + '</' + tn + '>';
				}
			}
			if (element.childNodes.length == 0) {
				if (element.textContent) {
					return element.textContent;
				}
				return '';
			}
			return inside();
		}
		let result = element;
		if (result && result !== undefined) {
			result = tryToGetTextContentRecursive(element);
			result = result.
				replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().
				replace(/(〙<\/span><\/a>)\s(<a[^>].+><span class="InlineBlock">〘)/g, '$1$2').trim();
		}
		return result;
	}
	function getTargetDomain(individualSiteLink) {
		const config = linkConfigs[individualSiteLink];
		if (config && config.targetDomain) return config.targetDomain;
		let domain = "";
		if (individualSiteLink) {
			let hasSlashIndex = individualSiteLink.indexOf("/");
			if (hasSlashIndex && hasSlashIndex > -1) hasSlashIndex = hasSlashIndex + 1;
			else hasSlashIndex = individualSiteLink.length;
			domain = individualSiteLink.slice(0, hasSlashIndex);
		}
		return domain;
	}
	function getNovelId(url) {
		if (!url) return null;
		for (const key in linkConfigs) {
			const config = linkConfigs[key];
			const match = url.match(new RegExp(key, "i"));
			if (match && match[1]) {
				return (config.idPrefix || "") + match[1];
			}
		}
		return url;
	}
	function getLinkID(link, configKey) {
		const match = link.match(new RegExp(configKey, "i"));
		if (match && match[1]) {
			const ID = match[1];
			const UrlPrefix = match[0].slice(0, match[0].length - ID.length);
			return { ID, UrlPrefix };
		}
		return { ID: null, UrlPrefix: null };
	}
	async function getCoverDataFromUrl(
		elementUrl,
		individualPage = undefined,
	) {
		if (elementUrl && elementUrl.startsWith("file://")) return undefined;
		let coverData;
		let linkID;
		let hasApiAccess = false;
		let targetDomain;
		let targetPage = linkConfigs[individualPage];
		if (targetPage) {
			hasApiAccess = targetPage.mainAPI;
			targetDomain = getTargetDomain(individualPage);
		}
		elementUrl = getLinkToSeriesPage(elementUrl, individualPage);
		if (hasApiAccess) {
			const { ID } = getLinkID(elementUrl, individualPage);
			linkID = ID;
		}
		let apiData;
		if (hasApiAccess) {
			switch (individualPage) {
				case MD_REGEX:
					apiData = await getCoverDataFromMangaDex(linkID);
					break;
				case TV_REGEX:
					apiData = await getCoverDataFromTVmaze(linkID);
					break;
			}
		} else {
			apiData = await getCoverDataFromParsingTargetUrl(
				elementUrl,
				targetPage,
				targetDomain,
			);
		}
		let imageLink;
		if (apiData !== undefined) {
			coverData = apiData;
			imageLink = coverData.url;
		}
		imageLink = processRelativeImageLink(imageLink, targetDomain);
		let cData;
		if (coverData !== undefined) {
			cData = coverData;
			cData.NovelDomain = targetDomain;
			cData.url = imageLink;
		}
		if (cData && cData.readyPromise) {
			cData.readyPromise.then(async () => {
				await GM_setCachedValue(elementUrl, cData);
			});
		} else {
			await GM_setCachedValue(elementUrl, cData);
		}
		return cData;
	}
	function processRelativeImageLink(imageLink, targetDomain) {
		if (!imageLink) return imageLink;
		let isExternal = false;
		try {
			if (targetDomain && window.location.hostname !== new URL("https://" + targetDomain).hostname) {
				isExternal = true;
			}
		} catch (e) { }
		if (imageLink.tagName && imageLink.tagName == "IMG") {
			imageLink = imageLink.getAttribute("src");
		}
		if (imageLink instanceof HTMLElement) {
			let hasSrc = imageLink.getAttribute("src");
			if (hasSrc) imageLink = hasSrc;
		}
		if (typeof imageLink === "string") {
			if (imageLink.startsWith("file://")) imageLink = imageLink.replace(/^file:\/\//, "https://");
			if (imageLink.startsWith("//")) imageLink = "https:" + imageLink;
			else if (imageLink.startsWith("/")) imageLink = "https://" + targetDomain + imageLink;
			else if (isExternal && !imageLink.startsWith("http")) imageLink = "https://" + imageLink;
			imageLink = imageLink.replace(/\?time=\d+$/, "");
		}
		return imageLink;
	}
	function rejectErrorStatusMessage(xhr) {
		let rejectNotification = "";
		switch (true) {
			case xhr.status == 400:
				rejectNotification = "bad request: xhr response == " + xhr.status;
				break;
			case xhr.status == 401:
				rejectNotification = "unauthorized: xhr response == " + xhr.status;
				break;
			case xhr.status == 402:
				rejectNotification = "Payment Required: xhr response == " + xhr.status;
				break;
			case xhr.status == 403:
				rejectNotification = "Forbidden: xhr response == " + xhr.status;
				break;
			case xhr.status == 404:
				rejectNotification =
					xhr.finalUrl + "<br/>page not found: xhr response == " + xhr.status;
				break;
			case xhr.status == 408:
				rejectNotification = "request timeout: xhr response == " + xhr.status;
				break;
			case xhr.status == 410:
				rejectNotification =
					"page gone and not available: xhr response == " + xhr.status;
				break;
			case xhr.status == 425:
				rejectNotification =
					"page request too early: xhr response == " + xhr.status;
				break;
			case xhr.status == 429:
				rejectNotification =
					"rate limit reached. Please notify to increase/adjust rate limit to setting for this domain: xhr response == " +
					xhr.status;
				break;
			case xhr.status == 451:
				rejectNotification =
					"page was removed cause of legal reasons: xhr response == " +
					xhr.status;
				break;
			case xhr.status == 500:
				rejectNotification = "page has an internal server error: xhr response == " + xhr.status;
				break;
			case xhr.status == 503:
				rejectNotification =
					"page Unavailable. Down for maintenance or overloaded: xhr response == " +
					xhr.status;
				break;
			case xhr.status == 511:
				rejectNotification =
					"page Network Authentication Required: xhr response == " + xhr.status;
				break;
			default:
				rejectNotification = xhr;
		}
		return rejectNotification;
	}
	async function setLinkState(element, state = undefined, preloadUrlRequest = false) {
		if (element) {
			let hasText = element.textContent != "";
			if (showIconNextToLink) {
				const externalTarget = element.getAttribute("coverDataExternalTarget");
				let elementUrl = getLinkToSeriesPage(element.href, externalTarget);
				if (state === undefined) {
					const coverData = await GM_getCachedValue(elementUrl);
					if (
						coverData === undefined ||
						coverData === null ||
						coverData === "null" ||
						preloadUrlRequest
					) {
						state = linkIconEnum.popupPossibleNotLoadedOrMarkedForPreloading; //no coverData waiting for interaction or forced reloading/preloading
					} else {
						state = linkIconEnum.popupHasCoverData; //coverData available and loaded
					}
				}
				element.classList.remove(
					"hasCoverPreviewPopup",
					"loadingUrlPreload",
					"loadingUrl",
					"hasLoadedCoverPreviewPopup",
					"errorUrl",
					"errorUrlPreload",
				);
				switch (state) {
					case linkIconEnum.popupPossibleNotLoadedOrMarkedForPreloading: //popup possible/no cover data preloaded; if preloadUrlRequest true set inactive preloading icon
						if (hasText) {
							if (preloadUrlRequest) {
								element.classList.add("loadingUrlPreload");
							} else {
								element.classList.add("hasCoverPreviewPopup");
							}
						}
						break;
					case linkIconEnum.popupLoading: //currently loading coverData
						if (hasText) element.classList.add("loadingUrl");
						break;
					case linkIconEnum.popupHasCoverData: //coverData preloaded
						if (hasText) element.classList.add("hasLoadedCoverPreviewPopup");
						break;
					case linkIconEnum.error:
						if (hasText) {
							if (preloadUrlRequest) {
								element.classList.add("errorUrlPreload");
							} else {
								element.classList.add("errorUrl");
							}
						}
						break;
				}
			} else {
				element.classList.remove(
					"hasCoverPreviewPopup",
					"loadingUrlPreload",
					"loadingUrl",
					"hasLoadedCoverPreviewPopup",
					"errorUrl",
					"errorUrlPreload",
				);
			}
		}
	}
	function syncLinksByCacheKey(cacheKey, state) {
		if (!cacheKey) return;
		if (state === linkIconEnum.error && cacheKey === activeHoverCacheKey) {
			hidePopUp();
		}
		for (let i = 0; i < AllSeriesNodes.length; i++) {
			const el = AllSeriesNodes[i];
			if (el.getAttribute("data-cache-key") === cacheKey) {
				setLinkState(el, state);
				const siteKey = el.getAttribute("coverDataExternalTarget");
				if (siteKey && Preloads[siteKey]) {
					const nodeIndex = Preloads[siteKey].PendingNodes.indexOf(el);
					if (nodeIndex !== -1) {
						Preloads[siteKey].PendingNodes.splice(nodeIndex, 1);
					}
				}
			}
		}
		if (state === linkIconEnum.popupHasCoverData) {
			preloadedUrlSet.add(cacheKey);
		}
	}
	function getLinkToSeriesPage(elementUrl, individualPage = undefined) {
		elementUrl = String(elementUrl).
			replace(/^https?:\/\/([^\/]+)/i, (_, host) => "https://" + host.toLowerCase()).
			replace(/^https:\/\/(www|m)\./, "https://").
			replace(/^https:\/\/royalroadl?\.com\//, "https://royalroad.com\/");
		if (individualPage) {
			const { ID, UrlPrefix } = getLinkID(elementUrl, individualPage);
			if (typeof UrlPrefix === "string" && typeof ID === "string") {
				elementUrl = UrlPrefix + ID; //in case of direct chapter link provided with linkIK
			}
		}
		elementUrl = String(elementUrl); // ensure string after any reassignment
		if (elementUrl.endsWith("/")) {
			elementUrl = elementUrl.slice(0, -1);
		}
		return elementUrl;
	}
	async function parseSeriesPage(
		element,
		forceReload = false,
		hoveredTitle = undefined,
		event = undefined,
		targetPage = undefined,
	) {
		const cacheKey = getLinkToSeriesPage(element.href, targetPage);
		const rawNetworkUrl = element.href;
		let coverData;
		if (!forceReload) coverData = await GM_getCachedValue(cacheKey);
		let PromiseResult;
		if (
			!forceReload &&
			coverData !== undefined &&
			coverData !== null &&
			coverData.title
		) {
			PromiseResult = coverData;
			if (Date.now() - coverData.cachedTime >= UpdateAtCacheAge) {
				(async () => {
					try {
						coverData.updateStatus = "updating";
						if (currentTitleHover === coverData.title || currentTitleHover === hoveredTitle) {
							updateCurrentPopupContent();
						}
						let newCoverData = await getCoverDataFromUrl(rawNetworkUrl, targetPage);
						if (newCoverData) {
							newCoverData.updateStatus = "done";
							if (newCoverData.readyPromise) {
								newCoverData.readyPromise.then(async () => {
									await GM_setCachedValue(cacheKey, newCoverData);
								});
							} else {
								await GM_setCachedValue(cacheKey, newCoverData);
							}
							if (currentTitleHover === coverData.title || currentTitleHover === hoveredTitle || currentCoverData === coverData) {
								currentCoverData = newCoverData;
								updateCurrentPopupContent();
							}
							Object.assign(coverData, newCoverData);
						}
					} catch (err) {
						console.error("Background update failed", err);
					} finally {
						if (coverData.updateStatus !== "done") {
							coverData.updateStatus = "done";
							if (currentTitleHover === coverData.title || currentTitleHover === hoveredTitle) {
								updateCurrentPopupContent();
							}
						}
					}
				})();
			}
		} else {
			showPopupLoading(hoveredTitle, hoveredTitle, event);
			PromiseResult = getCoverDataFromUrl(rawNetworkUrl, targetPage).then(async (cData) => {
				if (cData && cData.readyPromise) {
					await cData.readyPromise;
				}
				if (cData && cData.title) {
					cData.updateStatus = "done";
					await GM_setCachedValue(cacheKey, cData);
				}
				return cData;
			});
		}
		PromiseResult = await PromiseResult;
		if (!PromiseResult || !PromiseResult.title) {
			syncLinksByCacheKey(cacheKey, linkIconEnum.error);
			throw new Error("No valid data found for " + cacheKey);
		}
		syncLinksByCacheKey(cacheKey, linkIconEnum.popupHasCoverData);
		return PromiseResult;
	}
	function removeEventListenerFromNodes(arrayTargetNode) {
		if (arrayTargetNode && arrayTargetNode.length > 0) {
			arrayTargetNode.map(function (el) {
				if (
					eventListenerStyle === undefined ||
					eventListenerStyle === null ||
					eventListenerStyle == 0
				) {
					el.removeEventListener("mouseenter", mouseEnterPopup);
					el.removeEventListener("mouseleave", hideOnMouseLeave);
				}
			});
		}
	}
	function isElementInViewport(el) {
		const rect = el.getBoundingClientRect();
		const vWidth = window.innerWidth || document.documentElement.clientWidth;
		const vHeight = window.innerHeight || document.documentElement.clientHeight;
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom < vHeight &&
			rect.right < vWidth
		);
	}
	function preloaderLoop(siteKey) {
		const siteState = Preloads[siteKey];
		if (!siteState) return;
		if (
			(!ignorePreloaderBudget &&
				(siteState.Completed >= MaximumSitePreloads ||
					Preloads["AllSites"].Completed >= MaximumTotalPreloads)) ||
			siteState.PendingNodes.length === 0
		) {
			siteState.Timeout = null;
			return;
		}
		if (
			!ignorePreloaderBudget &&
			(siteState.Completed + siteState.InProgress >= MaximumSitePreloads ||
				Preloads["AllSites"].Completed + Preloads["AllSites"].InProgress >=
				MaximumTotalPreloads)
		) {
			siteState.Timeout = setTimeout(preloaderLoop, PreloadDelayMs, siteKey);
			return;
		}
		const visibleIndex = siteState.PendingNodes.findIndex(node =>
			isElementInViewport(node),
		);
		if (visibleIndex !== -1) {
			const node = siteState.PendingNodes.splice(visibleIndex, 1)[0];
			const targetPage = node.getAttribute("coverDataExternalTarget");
			siteState.InProgress++;
			Preloads["AllSites"].InProgress++;
			preloadForIndividualPage(node, targetPage, false, siteKey);
		}
		siteState.Timeout = setTimeout(preloaderLoop, PreloadDelayMs, siteKey);
	}
	async function preloadForIndividualPage(
		element,
		targetPage,
		forceReload = false,
		siteKey = undefined,
	) {
		if (!EnablePreloader && !showIconNextToLink && !forceReload) {
			return;
		}
		const elementUrl = element.href;
		const cacheKey = getLinkToSeriesPage(elementUrl, targetPage);
		if (preloadedUrlSet.has(cacheKey) && !forceReload) {
			if (siteKey && Preloads[siteKey]) {
				Preloads[siteKey].InProgress--;
			}
			Preloads["AllSites"].InProgress--;
			return;
		}
		const coverData = await GM_getCachedValue(cacheKey);
		if (coverData && !forceReload) {
			syncLinksByCacheKey(cacheKey, linkIconEnum.popupHasCoverData);
			if (siteKey && Preloads[siteKey]) {
				Preloads[siteKey].InProgress--;
			}
			Preloads["AllSites"].InProgress--;
			return;
		}
		syncLinksByCacheKey(cacheKey, linkIconEnum.popupLoading);
		parseSeriesPage(element, forceReload, undefined, undefined, targetPage)
			.then(() => {
				if (siteKey && Preloads[siteKey]) {
					Preloads[siteKey].Completed++;
					Preloads[siteKey].InProgress--;
				}
				Preloads["AllSites"].Completed++;
				Preloads["AllSites"].InProgress--;
			})
			.catch((_) => {
				if (siteKey && Preloads[siteKey]) {
					Preloads[siteKey].InProgress--;
				}
				Preloads["AllSites"].InProgress--;
			});
	}
	async function preloadCoverData(forceReload = false) {
		if (!EnablePreloader && !showIconNextToLink && !forceReload) { return; }
		AllSeriesNodes = [];
		for (let i = 0; i < linkConfigKeys.length; i++) {
			const siteKey = linkConfigKeys[i];
			if (!Preloads[siteKey]) {
				Preloads[siteKey] = {
					PendingNodes: [],
					Completed: 0,
					InProgress: 0,
					Timeout: null,
				};
			}
			const needsPreload = await updateSeriesNodes(
				AllSeriesNodes,
				siteKey,
				forceReload,
				true,
			);
			Preloads[siteKey].PendingNodes.push(...needsPreload);
		}
		removeEventListenerFromNodes(AllSeriesNodes);
		if (AllSeriesNodes.length > 0) {
			AllSeriesNodes.forEach(node => {
				if (eventListenerStyle == 0) {
					node.addEventListener("mouseenter", mouseEnterPopup);
					node.addEventListener("mouseleave", hideOnMouseLeave);
				}
			});
			for (let i = 0; i < linkConfigKeys.length; i++) {
				const siteKey = linkConfigKeys[i];
				if (
					Preloads[siteKey] &&
					Preloads[siteKey].PendingNodes.length > 0 &&
					!Preloads[siteKey].Timeout
				) {
					preloaderLoop(siteKey);
				}
			}
		}
	}
	function addStyles() {
		GM.addStyle(`
			#popup * {
				background-color: ${color['Background']};
			}
			#popup .imp {
				color: ${color['Important']};
			}
			#popup a, #popup a *  {
				color: ${color['Link']};
			}
			#popup * {
				color: ${color['Text']};
			}
			@keyframes rotate {
						to {transform: rotate(360deg);}
					}
			@keyframes dotsLoading{
				0%{
					opacity: 0;
				}
				50%{
					opacity: 1;
				}
				100%{
					opacity: 0;
				}
			}
			#dotLoading1{
				animation: dotsLoading 1s infinite;
			}
			#dotLoading2{
				animation: dotsLoading 1s infinite;
				animation-delay: 0.2s;
			}
			#dotLoading3{
				animation: dotsLoading 1s infinite;
				animation-delay: 0.4s;
			}
			.loadingUrl, .loadingUrlPreload, .hasCoverPreviewPopup, .hasLoadedCoverPreviewPopup, .errorUrl, .errorUrlPreload{
				padding:0 !important;
				margin:0 !important;
			}
			.loadingUrl:link, .loadingUrlPreload:link, .hasCoverPreviewPopup:link, .hasLoadedCoverPreviewPopup:link, .errorUrl:link, .errorUrlPreload:link{
				padding:0 !important;
				margin:0 !important;
			}
			.errorUrl::before, .errorUrlPreload::before{
				content:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="red" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>');
			}
			.loadingUrl::before{
				content:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-message-dots" width="14" height="14" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M0 0h24v24H0z" stroke="none" fill="none"/><path stroke="red" d="M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4" /><line x1="12" y1="11" x2="12" y2="11.01" stroke="red" fill="red" id="dotLoading1" /><line x1="8" y1="11" x2="8" y2="11.01" stroke="red" fill="red" id="dotLoading2" /><line x1="16" y1="11" x2="16" y2="11.01" stroke="red" fill="red" id="dotLoading3" /></svg>');
			}
			.loadingUrlPreload::before{
				content:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-message-dots" width="14" height="14" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4"/><line x1="12" y1="11" x2="12" y2="11.01" stroke="red" fill="red" id="dotLoading1" /><line x1="8" y1="11" x2="8" y2="11.01" stroke="red" fill="red" id="dotLoading2" /><line x1="16" y1="11" x2="16" y2="11.01" stroke="red" fill="red" id="dotLoading3" /></svg>');
			}
			.hasCoverPreviewPopup::before{
				content:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-message" width="12px" height="12px" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4" /></svg>');
			}
			.hasLoadedCoverPreviewPopup::before{
				content:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-message" width="12px" height="12px" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="14" y2="13" /></svg>');
			}
			.blackFont {
					color:#000;
			}
			.whiteFont {
					color:#fff
			}
			.defaultTitleStyle {
					box-sizing: border-box;
					padding:5px 8px;
					min-height:unset;
					height:auto;
					display:inline-block;
					width:100%;
					text-align:center !important;
					justify-content: center;
					justify-items: center;
					border: 0 !important;
					border-bottom: 1px solid #000 !important;
					border-radius:0 !important;
					line-height:1.4em;
			}
			.defaultTitleStyleSmall {
				line-height:1.2em;
			}
			.defaultBackgroundStyle {
					align-items:center;
					pointer-events:none;
					max-width:100%;
					max-height:100%;
					text-align:center !important;
					justify-content: center;
					justify-items: center;
					height:auto;
					padding:0;
					background-color:#fff;
			}
			.ImgFitDefault{
					object-fit: contain;
					min-width: 0;
					min-height: 0;
					max-height: 400px;
					max-width: 400px;
					width:100%;
					height:100%;
					margin:2px;
					padding:0;
					position:unset;
					border-radius: 0;
			}
			#coverPreviewAutoScroll#style-4::-webkit-scrollbar-track,#coverPreviewContentAutoScroll#style-4::-webkit-scrollbar-track
			{
				-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
				background-color: #F5F5F5;
			}
			#coverPreviewAutoScroll::-webkit-scrollbar,#coverPreviewContentAutoScroll::-webkit-scrollbar
			{
				width: 2px;
				background-color: #F5F5F5;
			}
			#coverPreviewAutoScroll::-webkit-scrollbar-thumb, #coverPreviewContentAutoScroll::-webkit-scrollbar-thumb
			{
				background-color: #888;
			}
			#coverPreviewAutoScroll{
				overflow:auto;
				scrollbar-width: thin;
				scrollbar-color: #888 #F5F5F5;
			}
			#coverPreviewContentAutoScroll{
				display:block;
				overflow:auto;
				scrollbar-width: thin;
				scrollbar-color: #888 #F5F5F5;
			}
			#popup{
				box-sizing: border-box;
				overflow: hidden;
				max-width: calc(100vw - (100vw - 100%));
				min-height: 0;
				min-width: 0;
				width: 100%;
				border: 1px solid #000;
				border-radius:0;
				box-shadow: 0px 0px 5px #7A7A7A;
				position:fixed;
				z-index:1395;
				text-align: center !important;
				justify-content: start;
				justify-items: center;
				display: flex;
				flex-shrink: 1;
				flex-direction: column;
				opacity: 1;
			}
			.hidePopUp {
				visibility:hidden !important;
				opacity: 0 !important;
			}
			.ContentBorder{
				border:2px solid ${color['Border']} !important;
			}
			.popupContent {
				box-sizing: border-box;
				text-align: center !important;
				justify-content: center;
				justify-items: center;
				align-items: center;
				display: flex;
				flex-direction: column;
				min-height: 0;
				min-width: 0;
				padding: 1px !important;
				width: 100%;
				height: 100%;
				flex: 1;
				border-radius:0;
			}
			.popupDetail{
				flex-direction:unset !important;
				height:400px;
			}
			.coverDataTitle{
				border-bottom:1px solid white;
				padding:2px 0;
			}
			.containerPadding{
				justify-items:center;
				padding:10px
			}
			.popupTitleDetail{
				height:100% !important;
				width:auto !important;
				max-width:65% !important;
				border-radius: 0 !important;
				border:0 !important;
				border-right: 1px solid #000 !important;
				word-break: break-word;
			}
			.smallText{
					font-size: 0.8em;
			}
			.mediumText{
				font-size: 0.98em;
			}
			.small_smallText{
				font-size: 0.82em;
				line-height: 1.4em;
			}
			.small_mediumText{
				font-size: 0.78em;
				line-height: 1.2em;
			}
			.wordBreak {
					word-wrap: break-word !important;
					word-break: break-word;
			}
			.borderTop {
				width:100%;
				border-top:1px solid#fff;
				margin: 2px 0;
			}
			.InlineBlock {
				display: inline-block;
			}
			.whiteSpaceNoWrap {
				white-space: nowrap !important;
			}
			.flexColumn {
				display: flex !important;
				flex-direction: column !important;
			}
			.textAlignCenter {
				text-align: center !important;
			}
			.textAlignStart {
				text-align: start !important;
			}
			.fullWidth {
				width: 100% !important;
			}
			.fullHeight {
				height: 100% !important;
			}
			`);
	}
	function createPopUp() {
		let bodyElement = document.getElementsByTagName("BODY")[0];
		popup = document.createElement("div");
		popup.id = "popup";
		popupTitle = document.createElement("header");
		popupContent = document.createElement("content");
		popup.appendChild(popupTitle);
		popup.appendChild(popupContent);
		LineSVG = document.createElement("div");
		LineSVG.id = "diagnostic_dots";
		bodyElement.appendChild(LineSVG);
		popup.className = "defaultBackgroundStyle";
		const popupResizeObserver = new ResizeObserver(() => {
			if (popupVisible && currentPopupEvent && lastPopupTarget) {
				applyPopupPositioning(lastPopupTarget, currentPopupEvent);
			}
		});
		popupResizeObserver.observe(popup);
		popupContent.className = "popupContent";
		updatePopUpSize();
		popupTitle.className = "defaultTitleStyle";
		popup.addEventListener("mouseleave", hideOnMouseLeave);
		popup.style.left = 0;
		popup.style.top = 0; //avoid invisible popup outside regular site height
		hidePopUp();
		bodyElement.insertAdjacentElement("beforeend", popup);
	}
	function showPopupLoading(
		hoveredTitleLink,
		title,
		event,
		notification = "",
		coverData = undefined,
	) {
		const isActivePopup =
			currentTitleHover !== undefined &&
			hoveredTitleLink !== undefined &&
			currentTitleHover == hoveredTitleLink;
		if (isActivePopup) {
			let dummyCoverData = Object.assign({}, emptyCoverData);
			if (coverData) dummyCoverData = Object.assign(dummyCoverData, coverData);
			dummyCoverData.title = title || "⏳ Loading title…";
			dummyCoverData.chapters = "⏳ Loading chapters…";
			dummyCoverData.votes = "⏳ Loading rating…";
			dummyCoverData.status = "⏳ Loading status…";
			dummyCoverData.alternativeNames = "⏳ Loading alternative names…";
			dummyCoverData.description = notification || "⏳ Loading description…";
			dummyCoverData.genre = "⏳ Loading tags…";
			dummyCoverData.Tags = "⏳ Loading tags…";
			dummyCoverData.readingListTitle = "⏳ Loading reading list…";
			dummyCoverData.url = undefined; // Force text render
			dummyCoverData.isLoading = true;
			refreshPopUp(dummyCoverData, event);
		}
	}
	let direction = 1;
	let pauseTimeDifference = null;
	let currentPercent = null;
	let percentBeforeStyleChange;
	let hasChangedStyle = false;
	let requestId = [];
	let startTime = null;
	const scrollToTarget = function (idToScroll, node, duration = 7000) {
		let scrollOverflow = node.scrollHeight - node.offsetHeight;
		const updateStartValues = function (percent, currentTime) {
			if (percent) {
				scrollOverflow = node.scrollHeight - node.offsetHeight;
				startTime = currentTime - pauseTimeDifference;
				pauseTimeDifference = null;
			}
		};
		const loop = function (currentTime) {
			if (!startTime) {
				startTime = currentTime;
			}
			if (currentPercent != undefined && currentPercent !== null) {
				updateStartValues(currentPercent, currentTime);
				currentPercent = null;
			}
			if (hasChangedStyle) {
				updateStartValues(percentBeforeStyleChange, currentTime);
				hasChangedStyle = false;
			}
			let time = currentTime - startTime;
			const percent = Math.min(time / duration, 1);
			let targetScrollTop, targetScrollTopPercent;
			if (direction == 1) {
				targetScrollTopPercent = easeInOutQuad(percent);
			} else {
				targetScrollTopPercent = 1 - easeInOutQuad(percent);
			}
			targetScrollTop = scrollOverflow * targetScrollTopPercent;
			node.scrollTo(0, targetScrollTop, "auto");
			pauseTimeDifference = currentTime - startTime;
			if (autoScrollCoverData && popupVisible) {
				const insideContainerValue =
					targetScrollTop <= scrollOverflow && targetScrollTop >= 0;
				if (!(time < duration && insideContainerValue)) {
					startTime = currentTime;
					direction *= -1;
				}
				percentBeforeStyleChange = percent;
				requestId[idToScroll] = window.requestAnimationFrame(loop);
			} else {
				window.cancelAnimationFrame(requestId[idToScroll]);
				currentPercent = percent;
			}
		};
		requestId[idToScroll] = window.requestAnimationFrame(loop);
	};
	const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t); //https://gist.github.com/gre/1650294
	function autoScrollData(idToScroll = "coverPreviewAutoScroll") {
		coverDataContainer[idToScroll] = document.getElementById(idToScroll);
		setStartScrollPosition(idToScroll);
		if (autoScrollCoverData) {
			if (coverDataContainer[idToScroll]) {
				const hasOverflowValue =
					coverDataContainer[idToScroll].scrollHeight >
					coverDataContainer[idToScroll].offsetHeight;
				if (hasOverflowValue) {
					if (requestId[idToScroll])
						window.cancelAnimationFrame(requestId[idToScroll]);
					scrollToTarget(idToScroll, coverDataContainer[idToScroll]);
				}
			}
		}
	}
	function resetAutoScroll(idToScroll = "coverPreviewAutoScroll") {
		direction = 1;
		currentPercent = null;
		startTime = null;
		pauseTimeDifference = null;
		hasChangedStyle = false;
		if (requestId[idToScroll])
			window.cancelAnimationFrame(requestId[idToScroll]);
	}
	function setStartScrollPosition(idToScroll) {
		if (coverDataContainer[idToScroll] && currentPercent) {
			let scrollOverflow =
				coverDataContainer[idToScroll].scrollHeight -
				coverDataContainer[idToScroll].offsetHeight;
			let targetScrollTop, targetScrollTopPercent;
			if (direction == 1) {
				targetScrollTopPercent = easeInOutQuad(currentPercent);
			} else {
				targetScrollTopPercent = 1 - easeInOutQuad(currentPercent);
			}
			targetScrollTop = scrollOverflow * targetScrollTopPercent;
			coverDataContainer[idToScroll].scrollTop = targetScrollTop;
		}
	}
	function refreshPopUp(coverData, e = undefined) {
		if (coverData && coverData !== undefined) {
			const link = coverData.url;
			if (
				link === undefined ||
				link === null ||
				link == "" ||
				link == "undefined"
			) {
				if (coverData.isLoading) {
					popupContent.innerHTML =
						'<div class="containerPadding">⏳ Loading cover image…</div>';
				} else {
					popupContent.innerHTML =
						'<div class="containerPadding">No Cover Image found</div>';
				}
			} else {
				popupContent.innerHTML =
					'<img src="' + link + '" class="ImgFitDefault" ></img>';
			}
			adjustPopupTitleDetail(coverData);
			if (e !== undefined) {
				popupPos(e);
			}
		}
	}
	function getRatingNumber(ratingString) {
		let ratingNumber;
		if (ratingString) {
			const matchesVotes = ratingString.toLowerCase().match(reVoteCount);
			const matches = ratingString.match(reRating); //"Rating(3.3 / 5.0, 1940 votes)"
			const matchesSingleNumber = ratingString.match(reRatingSingleNumber); //4.5
			let hasVoteCountBigger0 = true;
			if (matchesVotes && matchesVotes.length > 1) {
				if (matchesVotes[1] == 0 || matchesVotes[1] == "0") {
					hasVoteCountBigger0 = false;
				}
			}
			if (matches && matches.length == 3 && hasVoteCountBigger0) {
				ratingNumber = matches[1];
			} else {
				if (
					hasVoteCountBigger0 &&
					matchesSingleNumber &&
					matchesSingleNumber.length == 2
				) {
					ratingNumber = matchesSingleNumber[1];
				}
			}
		}
		return ratingNumber;
	}
	function getChapters(statusString) {
		let result;
		if (statusString && statusString.length > 0) {
			let chapterCount;
			let lowerCaseStatusString = statusString.toLowerCase();
			const matches = lowerCaseStatusString.match(reChapters);
			let webnovel = "";
			let hasVolumenInString = false;
			let hasChapterInString = false;
			if (matches && matches.length >= 2) {
				hasChapterInString = true;
				chapterCount = matches[1];
				if (matches[2]) {
					webnovel = " WN";
				}
			}
			if (!chapterCount) {
				const matchesBehind = lowerCaseStatusString.match(
					reChaptersNumberBehind,
				);
				if (matchesBehind && matchesBehind.length >= 2) {
					hasChapterInString = true;
					chapterCount = matchesBehind[1];
				}
			}
			if (!chapterCount) {
				const matchesNumbers = lowerCaseStatusString.match(
					reChaptersOnlyNumbers,
				); //example string "6892(Ongoing)"
				if (matchesNumbers && matchesNumbers.length >= 2) {
					chapterCount = matchesNumbers[1];
				}
			}
			if (lowerCaseStatusString.includes("vol")) hasVolumenInString = true;
			if (chapterCount) {
				let numberType = " Chapters";
				if (hasVolumenInString && !hasChapterInString) numberType = " Vol";
				result = chapterCount + webnovel + numberType;
			}
		}
		return result;
	}
	function getCompletedState(statusString) {
		let result = false;
		if (statusString && statusString.toLowerCase().includes("complete")) {
			result = true;
		}
		return result;
	}
	function getOngoingState(statusString) {
		let result = false;
		if (statusString && statusString.toLowerCase().includes("ongoing")) {
			result = true;
		}
		return result;
	}
	function getDetailsString(coverData) {
		let completeDetails = "";
		if (showDescription) {
			if (coverData.description && coverData.description.length > 0) {
				completeDetails +=
					'<div class="borderTop">Description: ' +
					coverData.description +
					"</div>";
			} else {
				completeDetails +=
					'<div class="borderTop">Description: Description Empty or error in coverData. Please reload series page info</div>';
			}
		} else {
			if (coverData.votes) {
				let label = (new RegExp('Ratings?\\:')).test(coverData.votes) ? '' : 'Rating: ';
				completeDetails +=
					'<div class="borderTop">' + label + coverData.votes + "</div>";
			}
			if (coverData.status) {
				completeDetails +=
					'<div class="borderTop">Status: ' + coverData.status + "</div>";
			}
			if (coverData.chapters) {
				let label = (new RegExp('(Chapter|Episode)s?\\:')).test(coverData.chapters) ? '' : 'Chapters: ';
				completeDetails +=
					'<div class="borderTop">' + label + coverData.chapters + "</div>";
			}
			if (coverData.genre) {
				let label = (new RegExp('Genres?\\:')).test(coverData.genre) ? '' : 'Genre: ';
				completeDetails +=
					'<div class="borderTop">' + label + coverData.genre + "</div>";
			}
			if (coverData.Tags) {
				let label = (new RegExp('Tags?\\:')).test(coverData.Tags) ? '' : 'Tags: ';
				completeDetails +=
					'<div class="borderTop">' + label + coverData.Tags + "</div>";
			}
		}
		return completeDetails;
	}
	function getShortenedDetailsString(coverData) {
		let completeDetails = "";
		let rating = getRatingNumber(coverData.votes);
		let chapters = getChapters(coverData.status);
		let seriesChapters = getChapters(coverData.chapters);
		let completed = getCompletedState(coverData.status);
		let ongoing = getOngoingState(coverData.status);
		if (rating || chapters || seriesChapters || completed || ongoing) {
			if (rating !== undefined) rating += "★ ";
			else rating = "";
			if (chapters !== undefined) chapters = chapters + " ";
			else chapters = "";
			if (seriesChapters !== undefined) seriesChapters = seriesChapters + " ";
			else seriesChapters = "";
			if (seriesChapters != "") chapters = "";
			if (completed) completed = "🗹 ";
			else completed = ""; //https://utf8icons.com/
			if (ongoing) ongoing = "✎ ";
			else ongoing = "";
			completeDetails +=
				'<span class="' +
				smallTextStyle +
				' whiteSpaceNoWrap"> [' +
				rating +
				chapters +
				seriesChapters +
				completed +
				ongoing +
				"]</span>";
		}
		return completeDetails;
	}
	async function adjustPopupTitleDetail(coverData, title = undefined) {
		let titleToShow = "";
		popupTitle.textContent = "";
		if (coverData && coverData.title) titleToShow = coverData.title;
		else if (title !== undefined) titleToShow = title;
		let completeDetails = "";
		let updateIconSpan = "";
		let showReadingListIcon = "";
		if (useReadingListIconAndTitle) {
			if (coverData.readingListIcon !== undefined) {
				if (showDetails) {
					showReadingListIcon =
						'📚📜:<img src="' +
						coverData.readingListIcon +
						'" width="16px"; height="16px" /> ';
				} else {
					showReadingListIcon =
						'<img src="' +
						coverData.readingListIcon +
						'" width="12px"; height="12px" /> ';
				}
			}
		}
		if (coverData && coverData.updateStatus === "updating") {
			updateIconSpan = '<span>⏳</span>';
		}
		popup.classList.add("ContentBorder");
		let alternativeNames = "";
		if (showDetails) {
			let showDomain = "";
			let showReadingListTitle = "";
			if (useReadingListIconAndTitle && !!coverData.readingListTitle) {
				if (coverData.readingListTitle) {
					showReadingListTitle =
						"<div>" +
						showReadingListIcon +
						" " +
						coverData.readingListTitle +
						"</div>";
				} else {
					showReadingListTitle =
						"<div>[&nbsp;] not in a reading list or logged in</div>";
				}
			}
			if (coverData.alternativeNames && coverData.alternativeNames != "") {
				alternativeNames = ` [Key ${Imp('A')}]`;
			}
			if (coverData.NovelDomain) {
				showDomain =
					' <div class="coverDataTitle">' + updateIconSpan + '🌐🔗[' +
					coverData.NovelDomain +
					"]</div>";
			} else if (updateIconSpan) {
				showDomain =
					' <div class="coverDataTitle">' + updateIconSpan + '</div>';
			}
			completeDetails +=
				'<span class="' +
				mediumTextStyle +
				' fullHeight flexColumn"><span class="coverDataTitle"><b>' +
				titleToShow +
				"</b>" +
				alternativeNames +
				showReadingListTitle +
				"</span> " +
				showDomain +
				'<div id="coverPreviewAutoScroll">' +
				getDetailsString(coverData) +
				"</div>"; //autoscroll
			completeDetails +=
				'<div class="borderTop ' +
				smallTextStyle +
				`">[Press key ${Imp('H')} to show a hotkey list]</div></span>`;
		} else {
			if (coverData.alternativeNames && coverData.alternativeNames != "") {
				alternativeNames = ` [${Imp('A')}]`;
			}
			completeDetails =
				'<span class="' +
				mediumTextStyle +
				'">' +
				updateIconSpan +
				showReadingListIcon +
				"<b>" +
				titleToShow +
				"</b>" +
				alternativeNames +
				" " +
				getShortenedDetailsString(coverData);
			completeDetails +=
				' <span class="' +
				smallTextStyle +
				`">[Key ${Imp('H')} hotkey list]</span></span>`;
		}
		popupTitle.innerHTML = completeDetails;
	}
	function Imp(K) { return '<span class="imp">' + K + '</span>'; }
	function setCurrentCoverDataAndLoadImage(coverData, hoveredTitle, e) {
		let seriesTitle = hoveredTitle;
		if (!hoveredTitle || coverData.title) {
			seriesTitle = coverData.title;
		}
		if (
			coverData !== undefined &&
			coverData !== null &&
			hoveredTitle == currentTitleHover
		) {
			currentCoverData = coverData;
		}
		if (e) {
			loadImageFromBrowser({
				coverData: currentCoverData,
				e: e,
				seriesTitle: seriesTitle,
				hoveredTitleLink: hoveredTitle,
			});
		}
	}
	async function ajaxLoadImageUrlAndShowPopup(
		forceReload = false,
		element,
		hoveredTitle,
		e,
		targetPage = undefined,
	) {
		const currentEvent = e;
		try {
			const coverData = await parseSeriesPage(
				element,
				forceReload,
				hoveredTitle,
				currentEvent,
				targetPage,
			);
			if (coverData !== undefined) {
				setCurrentCoverDataAndLoadImage(
					coverData,
					hoveredTitle,
					currentEvent,
				);
			}
		} catch (Error) {
			syncLinksByCacheKey(getLinkToSeriesPage(element.href, targetPage), linkIconEnum.error);
			showPopupLoading(
				hoveredTitle,
				hoveredTitle,
				currentEvent,
				Error.message || Error.statusText || Error,
			);
		}
	}
	function imageLoaded(
		coverData,
		hoveredTitleLink,
		seriesTitle = undefined,
		e = undefined,
	) {
		const hasMouseEnterEvent = seriesTitle && e !== undefined;
		const isActivePopup =
			currentTitleHover !== undefined &&
			hoveredTitleLink !== undefined &&
			currentTitleHover == hoveredTitleLink &&
			hasMouseEnterEvent; //currentTitleHover == hoveredTitleLink currentCoverData == coverData
		if (isActivePopup) {
			refreshPopUp(coverData, e); //popup only gets refreshed when currentTitleHover == seriesTitle
		}
	}
	function imageLoadingError(
		coverData,
		errorText = undefined,
		hoveredTitleLink,
		seriesTitle = undefined,
		e = undefined,
	) {
		let filename = "";
		if (coverData.url !== undefined && coverData.url != "undefined") {
			filename = decodeURIComponent(coverData.url);
		} else {
			filename = "";
		}
		let additionalText = "";
		if (errorText) additionalText = errorText;
		let errorMessage =
			'<div class="containerPadding">browser blocked/has error loading the cover: <br />' +
			filename +
			"<br />" +
			additionalText +
			"</div>";
		if (filename == "") {
			errorMessage =
				'<div class="containerPadding">target site has no coverImage<br />[no image tag found]<br /></div>';
		}
		showPopupLoading(
			hoveredTitleLink,
			seriesTitle,
			e,
			errorMessage,
			coverData,
		);
	}
	/**
	 * Fills popupContent with text metadata (description, genre, tags, etc.) while
	 * the cover image is still downloading, so the user sees something useful immediately.
	 * Called only when the image is not yet browser-cached.
	 */
	function showMetadataWhileImageLoads(coverData, hoveredTitleLink, e) {
		const isActivePopup =
			currentTitleHover !== undefined &&
			hoveredTitleLink !== undefined &&
			currentTitleHover == hoveredTitleLink;
		if (!isActivePopup) return;
		adjustPopupTitleDetail(coverData);
		let metaHtml = '<div class="containerPadding textAlignCenter">';
		if (coverData.url) {
			metaHtml += '<div><em>⏳ Loading cover image…</em></div>';
		} else {
			metaHtml += '<div><em>No cover image found</em></div>';
		}
		metaHtml += '</div>';
		popupContent.innerHTML = metaHtml;
		popupPos(e);
	}
	async function loadImageFromBrowser({
		coverData,
		e = undefined,
		seriesTitle = undefined,
		hoveredTitleLink = undefined,
	}) {
		let img = document.createElement("img"); //put img into dom. Let the image preload in background
		img.onload = () => {
			imageLoaded(coverData, hoveredTitleLink, seriesTitle, e);
		};
		img.onerror = async (_) => {
			let imageCanBeLoaded = await checkImageServerState(coverData.url);
			let errorMessage;
			if (imageCanBeLoaded) {
				errorMessage =
					"image fetching is possible, but image is blocked from loading.<br />Check for example ublock/umatrix or similar if domain is allowed to load images or image sizes exceeds allowed media size";
			} else {
				errorMessage =
					"image could not be loaded.";
			}
			imageLoadingError(
				coverData,
				errorMessage,
				hoveredTitleLink,
				seriesTitle,
				e,
			);
		};
		if (coverData !== undefined) {
			if (coverData.url !== undefined && coverData.url != "undefined") {
				img.src = coverData.url;
				if (img.complete) {
					imageLoaded(coverData, hoveredTitleLink, seriesTitle, e);
					img.onload = null; // Prevent double firing
				} else {
					showMetadataWhileImageLoads(coverData, hoveredTitleLink, e);
				}
			} else {
				imageLoadingError(
					coverData,
					"coverData has no image",
					hoveredTitleLink,
					seriesTitle,
					e,
				);
			}
		}
	}
	function hidePopUp() {
		lastPopupTarget = null; // Reset deduplication to allow re-hovering the same link
		activeHoverCacheKey = null;
		if (LineSVG) {
			LineSVG.classList.add("hidePopUp");
			LineSVG.innerHTML = "";
		}
		popup.classList.add("hidePopUp");
		currentTitleHover = undefined;
		currentCoverData = undefined;
		popupVisible = false;
		isPopupFrozen = false;
		popup.style.pointerEvents = "none";
		popupContent.style.pointerEvents = "none";
		pressedKeys = []; //window blur release keys
	}
	function showPopUp() {
		popup.classList.remove("hidePopUp");
		if (LineSVG) LineSVG.classList.remove("hidePopUp");
		popupVisible = true;
	}
	function hideOnMouseLeave() {
		if (isPopupFrozen) return;
		hidePopUp();
	}
	async function updateSeriesNodes(
		arrayTargetNode = [],
		configKey,
		forceReload = false,
		preloadUrlRequests = false,
	) {
		const config = linkConfigs[configKey];
		if (!config) return [];
		if (arrayTargetNode && arrayTargetNode.length > 0) {
			arrayTargetNode.forEach(function (selector) {
				if (
					eventListenerStyle === undefined ||
					eventListenerStyle === null ||
					eventListenerStyle == 0
				) {
					selector.removeEventListener("mouseleave", hideOnMouseLeave);
				}
			});
		}
		const keywords = config.selectorKeywords || [config.searchString];
		let seriesLinkNodes = [];
		keywords.forEach(keyword => {
			const nodes = document.querySelectorAll(
				':not(.digg_pagination) > a[href*="' + keyword + '" i]', //not(.digg_pagination) > fix to block linking from pagination; 'i' = case-insensitive href match
			);
			seriesLinkNodes.push(...Array.from(nodes));
		});
		let prunedSeriesLinkNodes = [];
		if (seriesLinkNodes && seriesLinkNodes.length > 0) {
			for (const el of seriesLinkNodes) {
				if (arrayTargetNode.includes(el)) continue;
				const elementUrl = el.href;
				let hasLinkMatch = false;
				const match = elementUrl.match(new RegExp(configKey, "i"));
				if (match && match[1]) {
					hasLinkMatch = true;
				}
				if (hasLinkMatch) {
					const hoveredNovelId = getNovelId(elementUrl);
					const currentNovelId = getNovelId(window.location.href);
					if (hoveredNovelId && hoveredNovelId === currentNovelId) {
						hasLinkMatch = false;
					}
				}
				if (hasLinkMatch) {
					el.setAttribute("coverDataExternalTarget", configKey);
					const cacheKey = getLinkToSeriesPage(elementUrl, configKey);
					el.setAttribute("data-cache-key", cacheKey);
					arrayTargetNode.push(el);
					const coverData = await GM_getCachedValue(cacheKey);
					if (coverData && !forceReload) {
						await setLinkState(el, linkIconEnum.popupHasCoverData, false);
					} else {
						await setLinkState(el, undefined, forceReload || preloadUrlRequests);
						prunedSeriesLinkNodes.push(el);
					}
				}
			}
		}
		return prunedSeriesLinkNodes;
	}
	async function switchShowIconNextToLink() {
		showIconNextToLink = !showIconNextToLink;
		await GM.setValue("showIconNextToLink", showIconNextToLink);
		await preloadCoverData();
		updateCurrentPopupContent();
	}
	async function switchDetailsAndUpdatePopup() {
		await changeToNewDetailStyle();
		updateCurrentPopupContent();
		console.groupEnd("switchDetails");
	}
	async function switchTagsDescriptionAndUpdatePopup() {
		if (showDetails) {
			showDescription = !showDescription;
			await GM.setValue("showDescription", showDescription);
			updateCurrentPopupContent();
		}
	}
	async function switchShowReadingListIconAndTitle() {
		useReadingListIconAndTitle = !useReadingListIconAndTitle;
		await GM.setValue("useReadingListIconAndTitle", useReadingListIconAndTitle);
		updateCurrentPopupContent();
	}
	function updateCurrentPopupContent() {
		if (currentCoverData !== undefined) {
			loadImageFromBrowser({
				coverData: currentCoverData,
				e: currentPopupEvent,
				seriesTitle: currentTitleHover,
				hoveredTitleLink: currentTitleHover,
			});
		} else if (currentTitleHover !== undefined) {
			let dummyCoverData = Object.assign({}, emptyCoverData);
			dummyCoverData.title = currentTitleHover || "⏳ Loading title…";
			dummyCoverData.description = "⏳ Loading description…";
			dummyCoverData.genre = "⏳ Loading tags…";
			dummyCoverData.Tags = "⏳ Loading tags…";
			dummyCoverData.url = undefined;
			dummyCoverData.isLoading = true;
			refreshPopUp(dummyCoverData, currentPopupEvent);
		}
	}
	async function changeToNewDetailStyle(toggleDetails = true) {
		if (toggleDetails) showDetails = !showDetails;
		await GM.setValue("showDetails", showDetails);
		updatePopUpSize();
	}
	async function mouseEnterPopup(e, forceReload = false) {
		if (isPopupFrozen) return;
		if (e !== undefined) {
			const target = e.target;
			// Event Deduplication: Only skip if popup is already VISIBLE for this target.
			// This allows re-hovering the same link to show the popup again if it was hidden.
			if (target === lastPopupTarget && popupVisible && !forceReload) return;
			lastPopupTarget = target;
			e.preventDefault();
			let Href = target.href; // element.attr('href');
			let coverDataExternalTarget = target.getAttribute(
				"coverDataExternalTarget",
			);
			if (
				Href &&
				(coverDataExternalTarget !== undefined &&
					coverDataExternalTarget !== null &&
					(new RegExp(coverDataExternalTarget, "i")).test(Href))
			) {
				const hoveredNovelId = getNovelId(Href);
				const currentNovelId = getNovelId(window.location.href);
				if (hoveredNovelId && hoveredNovelId === currentNovelId) {
					return;
				}
				let shortSeriesTitle = target.text; //element.text(); //get linkname
				const dataTitle = target.getAttribute("datatitle");
				const linkTitle = target.getAttribute("title");
				const hasDataTitle =
					dataTitle === null ||
					dataTitle == "null" ||
					dataTitle === undefined ||
					!dataTitle;
				if (linkTitle !== null && hasDataTitle) {
					target.setAttribute("datatitle", linkTitle);
					target.removeAttribute("title");
				}
				let seriesTitle = target.getAttribute("datatitle"); //element.attr('datatitle'); //try to get native title if available from datatitle
				if (
					seriesTitle === null || //has no set native long title -> use (available shortened) linkname
					seriesTitle == "null" ||
					PREDEFINED_NATIVE_TITLE_ARRAY.some((nativeTitle) =>
						seriesTitle.includes(nativeTitle),
					)
				) {
					seriesTitle = shortSeriesTitle;
				}
				if (
					seriesTitle === undefined ||
					seriesTitle === null ||
					seriesTitle == ""
				) {
					seriesTitle = Href;
				}
				currentTitleHover = seriesTitle; //mark which Title is currently hovered
				const wasOverDifferentLink = currentTitleHover != previousTitleHover;
				if (wasOverDifferentLink) {
					resetAutoScroll();
					autoScrollCoverData = true;
				}
				if (currentTitleHover != undefined) {
					previousTitleHover = currentTitleHover;
				}
				currentPopupEvent = e;
				let targetPage = coverDataExternalTarget;
				let mainSeriesHref = getLinkToSeriesPage(Href, targetPage);
				activeHoverCacheKey = mainSeriesHref;
				let hasCoverData = await GM_getCachedValue(mainSeriesHref);
				if (!(hasCoverData && hasCoverData.title) || forceReload) {
					syncLinksByCacheKey(mainSeriesHref, linkIconEnum.popupLoading);
				}
				ajaxLoadImageUrlAndShowPopup(
					forceReload,
					target, //Href
					currentTitleHover,
					e,
					targetPage,
				);
			}
		}
	}
	async function forceReload(forceReload = true) {
		await mouseEnterPopup(currentPopupEvent, forceReload);
	}
	function updatePopUpSize() {
		let targetHeight = defaultHeight;
		if (showSmaller) targetHeight = smallHeight;
		const marginX = 9 * 2; // windowMargin * 2
		if (showDetails) {
			popup.classList.add("popupDetail");
			popupTitle.classList.add("popupTitleDetail");
			const minWidthValue = "min(" + targetHeight * 2 + "px, (100vw - (100vw - 100%) - " + marginX + "px))";
			if (supportsCSSMin) {
				popup.style.maxWidth = minWidthValue;
			} else {
				popup.style.maxWidth = "calc(100vw - (100vw - 100%) - " + marginX + "px)";
				popup.style.width = targetHeight * 2 + "px";
			}
		} else {
			popup.classList.remove("popupDetail");
			popupTitle.classList.remove("popupTitleDetail");
			const minWidthValue = "min(" + targetHeight + "px, (100vw - (100vw - 100%) - " + marginX + "px))";
			if (supportsCSSMin) {
				popup.style.maxWidth = minWidthValue;
			} else {
				popup.style.width = targetHeight + "px";
			}
		}
		if (showSmaller) {
			mediumTextStyle = "small_mediumText";
			smallTextStyle = "small_smallText";
			popupTitle.classList.add("defaultTitleStyleSmall");
		} else {
			popupTitle.classList.remove("defaultTitleStyleSmall");
			mediumTextStyle = "mediumText";
			smallTextStyle = "smallText";
		}
		updateCurrentPopupContent();
	}
	function showAlternativeNamesList() {
		if (!showAlternativeNames || showAlternativeNames == "") {
			if (currentCoverData !== undefined) updateCurrentPopupContent();
		} else {
			if (
				currentCoverData.alternativeNames &&
				currentCoverData.alternativeNames != ""
			) {
				let alternativeNames = "";
				alternativeNames = currentCoverData.alternativeNames;
				popupContent.innerHTML =
					'<div id="coverPreviewContentAutoScroll" class="popupContent ' +
					mediumTextStyle +
					' textAlignStart fullWidth"><b>Alternative Titles:</b><br />' +
					alternativeNames +
					"</div>";
				if (currentCoverData !== undefined) popupPos(currentPopupEvent);
				autoScrollData("coverPreviewContentAutoScroll");
			}
		}
	}
	function showHotkeyList() {
		if (!showHotkeys) {
			if (currentCoverData !== undefined) {
				loadImageFromBrowser({
					coverData: currentCoverData,
					e: currentPopupEvent,
					seriesTitle: currentTitleHover,
					hoveredTitleLink: currentTitleHover,
				});
			}
		} else {
			popupContent.innerHTML =
				`<div id="coverPreviewContentAutoScroll" class="popupContent ${mediumTextStyle} textAlignStart">
				[Key ${Imp('1')}]: Switch detailed and simple popup<br />
				[Key ${Imp('2')}]: Switch between description and tags<br />
				[Key ${Imp('3')}]: Switch between small and big popup style<br />
				[Key ${Imp('4')}]: Pause/unpause auto-scrolling coverData<br/>
				[Key ${Imp('5')}]: Reload cover data of hovered link<br />
				[Key ${Imp('6')}]: Reload <b>all</b> links on current page (ignore network budget)<br />
				[Key ${Imp('7')}]: Cache <b>all</b> non-cached links on current page (ignore network budget)<br />
				[Key ${Imp('9')}]: Clear all cover data info<br />
				[Key ${Imp('A')}]: If available will show <b>a</b>lternative titles during holding of key A<br />
				[Key ${Imp('F')}]: <b>F</b>reeze/unfreeze popup style and prevent closing<br />
				[Key ${Imp('I')}]: Toggle coverPreview pre/loading state <b>i</b>con displaying next to link<br />
				[Key ${Imp('P')}]: Switch displaying of readinglist icon of <b>p</b>ersonal lists<br />
				[Key ${Imp('H')}]: Show this <b>h</b>otkey list during holding of key H<br />
				</div>`;
			if (currentCoverData !== undefined) popupPos(currentPopupEvent);
			autoScrollData("coverPreviewContentAutoScroll");
		}
	}
	async function reactToKeyPressWhenPopupVisible(event) {
		const key = event.key;
		if (popupVisible) {
			if (!pressedKeys.includes(key)) {
				pressedKeys.push(key);
				switch (key) {
					case "1":
						await switchDetailsAndUpdatePopup();
						break;
					case "5":
						await forceReload();
						break;
					case "6":
						ignorePreloaderBudget = true;
						await preloadCoverData(true);
						break;
					case "7":
						ignorePreloaderBudget = true;
						await preloadCoverData(false);
						break;
					case "9":
						await resetDatabase();
						await preloadCoverData();
						await forceReload();
						break;
					case "f":
					case "F":
						isPopupFrozen = !isPopupFrozen;
						if (isPopupFrozen) {
							popup.style.pointerEvents = "auto";
							popupContent.style.pointerEvents = "auto";
						} else {
							popup.style.pointerEvents = "none";
							popupContent.style.pointerEvents = "none";
						}
						break;
					case "2":
						await switchTagsDescriptionAndUpdatePopup();
						resetAutoScroll();
						autoScrollCoverData = true;
						autoScrollData();
						autoScrollData("coverPreviewContentAutoScroll");
						break;
					case "3":
						showSmaller = !showSmaller;
						await GM.setValue("showSmaller", showSmaller);
						updatePopUpSize();
						hasChangedStyle = true;
						break;
					case "4":
						autoScrollCoverData = !autoScrollCoverData;
						if (autoScrollCoverData) {
							autoScrollData();
							autoScrollData("coverPreviewContentAutoScroll");
						}
						break;
					case "h":
					case "H":
						showHotkeys = true;
						showHotkeyList();
						break;
					case "a":
					case "A":
						showAlternativeNames = true;
						showAlternativeNamesList();
						break;
					case "p":
					case "P":
						await switchShowReadingListIconAndTitle();
						updateCurrentPopupContent();
						break;
					case "i":
					case "I":
						await switchShowIconNextToLink();
						break;
				}
			}
		}
	}
	function releaseKey(event) {
		const key = event.key;
		const index = pressedKeys.indexOf(key);
		if (index !== -1) {
			pressedKeys.splice(index, 1);
		}
		if (event.key == "h") {
			showHotkeys = false;
			showHotkeyList();
		}
		if (event.key == "a") {
			showAlternativeNames = false;
			showAlternativeNamesList();
		}
	}
	function prepareEventListener() {
		window.addEventListener("blur", hidePopUp);
		window.addEventListener("keypress", reactToKeyPressWhenPopupVisible); //keypress gets repeated during keydown
		window.addEventListener("keyup", releaseKey);
		if (
			targetContainerIDArrayToObserve &&
			targetContainerIDArrayToObserve.length > 0
		) {
			for (let i = 0; i < targetContainerIDArrayToObserve.length; i++) {
				let targetNodeList = document.getElementById(
					targetContainerIDArrayToObserve[i],
				); //forum.novelupdates.com quickedit change. ajax content change
				if (targetNodeList) {
					mutationObserver.observe(targetNodeList, config);
				}
			}
		}
		window.addEventListener('pagehide', function () {
			window.removeEventListener("blur", hidePopUp);
			window.removeEventListener("keypress", reactToKeyPressWhenPopupVisible);
			window.addEventListener("keyup", releaseKey);
			popup.removeEventListener("mouseleave", hideOnMouseLeave);
			AllSeriesNodes = [];
			for (let i = 0; i < linkConfigKeys.length; i++) {
				updateSeriesNodes(AllSeriesNodes, linkConfigKeys[i]);
			}
			mutationObserver.disconnect();
		});
		if (eventListenerStyle == 1) {
			window.addEventListener("mousemove", throttledGetHoveredItem);
		}
	}
	function getHoveredItem(e) {
		if (eventListenerStyle == 1) {
			let isManagedLink = false;
			if (e.target && e.target.nodeName == "A" && e.target.href) {
				isManagedLink = linkConfigKeys.some((key) => (new RegExp(key, "i")).test(e.target.href));
			}
			if (
				e.target &&
				e.target != lastTarget &&
				e.target.nodeName == "A" &&
				isManagedLink
			) {
				lastTarget = e.target;
				mouseEnterPopup(e);
			} else {
				if (e.target.nodeName != "A") {
					lastTarget = undefined;
					hideOnMouseLeave();
				}
			}
		}
	}
	main();
	async function checkImageServerState(url) {
		let PromiseResult = new Promise(async function (resolve, reject) {
			function onLoad(xhr) {
				switch (true) {
					case xhr.status >= 200 && xhr.status < 399: {
						return resolve(true);
					}
					default:
						return reject(false);
				}
			}
			function onError(_) {
				return reject(false);
			}
			GM.xmlHttpRequest({
				method: "HEAD",
				url: url,
				onload: onLoad,
				onerror: onError,
			});
			return "error or skipped processing GM.xmlHttpRequest() in checkImageServerState()"; //reject("status error")
		});
		PromiseResult = await PromiseResult;
		return PromiseResult;
	}
	async function getDataFromAPI(
		apiPoint,
		{ hasDataContainer = undefined, responsetype = "json" } = {},
	) {
		let PromiseResult = new Promise(async function (resolve, reject) {
			function onLoad(xhr) {
				switch (true) {
					case xhr.status == 304:
					case xhr.status >= 200 && xhr.status < 399: {
						let apiData;
						switch (responsetype) {
							case "json":
								try {
									let tempJSON = JSON.parse(xhr.responseText);
									if (hasDataContainer) apiData = tempJSON[hasDataContainer];
									else apiData = tempJSON;
								} catch (e) { }
								break;
							case "Document":
								{
									const domDocument = xhr.response;
									apiData = domDocument;
								}
								break;
							case "text":
								{
									const domText = xhr.responseText;
									let parser = new DOMParser();
									const domDocument = parser.parseFromString(
										domText,
										"text/html",
									);
									apiData = domDocument;
								}
								break;
							default:
								const domDocument = xhr.responseText;
								apiData = domDocument;
								break;
						}
						if (apiData !== undefined) return resolve(apiData);
						else
							return reject(
								"no apiData error for responsetype: " + responsetype,
							);
					}
					default:
						return reject(rejectErrorStatusMessage(xhr));
				}
			}
			function onError(_) {
				return reject(false);
			}
			GM.xmlHttpRequest({
				method: "GET",
				responseType: responsetype,
				url: apiPoint,
				onload: onLoad,
				onerror: onError,
			});
			return undefined; //reject("status error")
		});
		PromiseResult = await PromiseResult;
		return PromiseResult;
	}
	async function getCoverDataFromMangaDex(id) {
		if (id) {
			let mangaDexData = getDataFromAPI(
				"https://api.mangadex.org/manga/" + id + "?includes[]=cover_art&includes[]=author",
				{ hasDataContainer: "data" },
			);
			let seriesChapters = getDataFromAPI(
				"https://api.mangadex.org/manga/" + id + "/aggregate"
			);
			let seriesStats = getDataFromAPI(
				"https://api.mangadex.org/statistics/manga/" + id
			);
			mangaDexData = await mangaDexData;
			let seriesGenre = [];
			let seriesTags = [];
			if (mangaDexData && mangaDexData.attributes && mangaDexData.attributes.tags) {
				for (let tag of mangaDexData.attributes.tags) {
					const name = tag.attributes.name.en || Object.values(tag.attributes.name)[0];
					const tagUrl = "https://mangadex.org/tag/" + tag.id + "/";
					const tagLink = '<a href="' + tagUrl + '" title="' + name + '"><span class="InlineBlock">〘' + name + '〙</span></a>';
					if (tag.attributes.group === "genre") seriesGenre.push(tagLink);
					else if (tag.attributes.group === "theme") seriesTags.push(tagLink);
				}
			}
			let status = mangaDexData.attributes.status;
			let bgCoverFileName = "";
			if (mangaDexData.relationships) {
				for (let obj of mangaDexData.relationships) {
					if (obj.type === "cover_art") {
						bgCoverFileName = obj.attributes.fileName;
						break;
					}
				}
			}
			let cData = Object.assign({}, emptyCoverData);
			cData.url = bgCoverFileName ? "https://uploads.mangadex.org/covers/" + id + "/" + bgCoverFileName : undefined;
			cData.title = mangaDexData.attributes.title.en || Object.values(mangaDexData.attributes.title)[0] || "";
			cData.alternativeNames = "";
			if (mangaDexData.attributes.altTitles) {
				cData.alternativeNames = mangaDexData.attributes.altTitles.map(t => Object.values(t)[0]).join("<br /> ");
			}
			cData.status = status;
			cData.genre = seriesGenre.join("");
			cData.Tags = seriesTags.join("");
			cData.description = mangaDexData.attributes.description.en || Object.values(mangaDexData.attributes.description)[0] || "";
			cData.votes = "⏳ Loading rating…";
			cData.chapters = "⏳ Loading chapters…";
			let p1 = seriesChapters.then(chapters => {
				let chapterCount = 0;
				if (chapters && chapters.volumes) {
					for (let key in chapters.volumes) {
						chapterCount += chapters.volumes[key].count || 0;
					}
				}
				cData.chapters = chapterCount > 0 ? chapterCount.toString() : "";
				if (currentCoverData === cData && popupVisible) updateCurrentPopupContent();
			}).catch(() => { cData.chapters = ""; });
			let p2 = seriesStats.then(stats => {
				let rating = "";
				if (stats && stats.statistics && stats.statistics[id] && stats.statistics[id].rating) {
					rating = stats.statistics[id].rating.bayesian;
					if (rating) rating = parseFloat(rating).toFixed(2).toString();
				}
				cData.votes = rating;
				if (currentCoverData === cData && popupVisible) updateCurrentPopupContent();
			}).catch(() => { cData.votes = ""; });
			cData.readyPromise = Promise.all([p1, p2]);
			return cData;
		}
		return undefined;
	}
	const tvMazeGenreMap = {
		'Action': 3, 'Adult': 19, 'Adventure': 4, 'Anime': 5,
		'Children': 6, 'Comedy': 2, 'Crime': 8, 'DIY': 24,
		'Drama': 1, 'Espionage': 25, 'Family': 9, 'Fantasy': 10,
		'Food': 7, 'History': 23, 'Horror': 11, 'Legal': 27,
		'Medical': 22, 'Music': 12, 'Mystery': 18, 'Nature': 20,
		'Romance': 13, 'Science-Fiction': 14, 'Sports': 26,
		'Supernatural': 28, 'Thriller': 15, 'Travel': 21,
		'War': 16, 'Western': 17,
	};
	async function getCoverDataFromTVmaze(id) {
		if (id) {
			let apiData = getDataFromAPI("https://api.tvmaze.com/shows/" + id);
			let seriesAlternativeNames = getDataFromAPI(
				"https://api.tvmaze.com/shows/" + id + "/akas",
			);
			let episodes = getDataFromAPI(
				"https://api.tvmaze.com/shows/" + id + "/episodes",
			);
			apiData = await apiData;
			let targetImageUrl;
			if (apiData.image) {
				targetImageUrl = apiData.image.medium || apiData.image.original;
			}
			let seriesRating;
			if (apiData.rating && apiData.rating.average) {
				seriesRating = apiData.rating.average.toString();
			}
			let cData = Object.assign({}, emptyCoverData);
			cData.url = targetImageUrl;
			cData.title = apiData.name;
			cData.status = apiData.status;
			cData.votes = seriesRating;
			cData.genre = Array.isArray(apiData.genres) ? apiData.genres.map(g => {
				const genreId = tvMazeGenreMap[g];
				if (genreId !== undefined) {
					const url = "https://www.tvmaze.com/shows?Show%5Bgenre%5D=" + genreId + "&Show%5Bsort%5D=7";
					return '<a href="' + url + '" title="' + g + '"><span class="InlineBlock">〘' + g + '〙</span></a>';
				}
				return g;
			}).join("") : "";
			cData.description = apiData.summary;
			cData.alternativeNames = "⏳ Loading alternative names…";
			cData.chapters = "⏳ Loading episodes…";
			let p1 = seriesAlternativeNames.then(akas => {
				if (akas && akas.length) {
					cData.alternativeNames = akas.map((e) => {
						const country = e.country ? " (" + e.country.name + ")" : "";
						return e.name + country;
					}).join("<br /> ");
				} else {
					cData.alternativeNames = "";
				}
				if (currentCoverData === cData && popupVisible) updateCurrentPopupContent();
			}).catch(() => { cData.alternativeNames = ""; });
			let p2 = episodes.then(ep => {
				if (ep && ep.length) cData.chapters = ep.length.toString();
				else cData.chapters = "";
				if (currentCoverData === cData && popupVisible) updateCurrentPopupContent();
			}).catch(() => { cData.chapters = ""; });
			cData.readyPromise = Promise.all([p1, p2]);
			return cData;
		}
		return undefined;
	}
	function extractCoverDataFromDocument(
		domDocument,
		targetPage,
		targetDomain = undefined,
	) {
		let temp;
		let imageLink;
		let containerNumber = 0;
		let seriesTitle;
		let seriesAlternativeNames;
		let seriesVotes;
		let seriesStatus;
		let seriesChapters;
		let seriesGenre;
		let seriesShowTags;
		let seriesDescription;
		let seriesReadingListIcon, seriesReadingListTitle;
		temp = domDocument.querySelectorAll(targetPage.seriesImage);
		if (targetPage.CONTAINER_NUMBER) {
			containerNumber = targetPage.CONTAINER_NUMBER;
		}
		imageLink = temp[containerNumber];
		seriesTitle = domDocument.querySelector(targetPage.seriesPageTitle);
		seriesAlternativeNames = domDocument.querySelector(
			targetPage.seriesAlternativeNames,
		);
		seriesVotes = domDocument.querySelector(targetPage.seriesPageVotes);
		seriesStatus = domDocument.querySelector(targetPage.seriesPageStatus);
		seriesChapters = domDocument.querySelector(targetPage.seriesPageChapters);
		seriesGenre = domDocument.querySelector(targetPage.seriesPageGenre);
		seriesShowTags = domDocument.querySelector(targetPage.seriesPageTags);
		seriesDescription = domDocument.querySelector(
			targetPage.seriesPageDescription,
		);
		seriesReadingListIcon = domDocument.querySelector(
			targetPage.seriesReadingListIcon,
		);
		seriesReadingListTitle = domDocument.querySelector(
			targetPage.seriesReadingListTitle,
		);
		let cData = Object.assign({}, emptyCoverData);
		if (imageLink) {
			cData.url = imageLink.getAttribute("data-src") || imageLink.getAttribute("src") || imageLink.getAttribute("href") || undefined;
			if (!cData.url) cData.url = imageLink.src || imageLink.href;
		} else {
			cData.url = undefined;
		}
		try { cData.title = tryToGetTextContent(seriesTitle, targetDomain); } catch (e) { cData.title = "Error loading title"; }
		try { cData.alternativeNames = tryToGetTextContent(seriesAlternativeNames, targetDomain); } catch (e) { cData.alternativeNames = ""; }
		try { cData.description = tryToGetTextContent(seriesDescription, targetDomain); } catch (e) { cData.description = "Error loading description"; }
		try { cData.genre = tryToGetTextContent(seriesGenre, targetDomain); } catch (e) { cData.genre = "Error loading genres"; }
		try { cData.Tags = tryToGetTextContent(seriesShowTags, targetDomain); } catch (e) { cData.Tags = "Error loading tags"; }
		try { cData.votes = tryToGetTextContent(seriesVotes, targetDomain); } catch (e) { cData.votes = ""; }
		try {
			let PossibleChapters = tryToGetTextContent(seriesChapters, targetPage.seriesPageChapters, "seriesPageChapters", targetDomain);
			if ((new RegExp('(Chapter|Episode|\\d+)')).test(PossibleChapters)) {
				cData.chapters = PossibleChapters;
			} else {
				cData.chapters = '';
			}
		} catch (e) { cData.chapters = ""; }
		try { cData.status = tryToGetTextContent(seriesStatus, targetDomain); } catch (e) { cData.status = ""; }
		try { cData.readingListTitle = tryToGetTextContent(seriesReadingListTitle, targetDomain); } catch (e) { cData.readingListTitle = ""; }
		if (targetPage.seriesReadingListIcon) {
			if (seriesReadingListIcon !== null && seriesReadingListIcon.tagName == "IMG") {
				cData.readingListIcon = seriesReadingListIcon.getAttribute("src");
				cData.readingListIcon = processRelativeImageLink(cData.readingListIcon, targetDomain);
			}
			if (cData.readingListIcon === null || cData.readingListIcon == "//novelupdates.com/wp-content/themes/ndupdates-child/js/selectico/addme.png") {
				cData.readingListIcon = undefined;
			}
		}
		cData.readyPromise = Promise.resolve();
		if (currentCoverData === cData && popupVisible) updateCurrentPopupContent();
		return cData;
	}
	async function getCoverDataFromParsingTargetUrl(
		elementUrl,
		targetPage,
		targetDomain = undefined,
	) {
		if (targetPage) {
			elementUrl = elementUrl.replace(/^https?:\/\/(m|www)\.webnovel\.com/, "https://webnovel.com");
			elementUrl = elementUrl.replace(/^https?:\/\/(www\.)?royalroadl?\.com/, "https://royalroad.com");
			let domDocument = await getDataFromAPI(elementUrl, {
				responsetype: "text",
			});
			const cData = extractCoverDataFromDocument(domDocument, targetPage, targetDomain);
			if (!isCoverDataValid(cData)) return undefined;
			return cData;
		}
		return undefined;
	}
	async function cacheCurrentPage() {
		const currentUrl = window.location.href;
		for (const key in linkConfigs) {
			const config = linkConfigs[key];
			if (new RegExp(key, "i").test(currentUrl)) {
				const targetDomain = getTargetDomain(key);
				if (config.mainAPI) {
					await getCoverDataFromUrl(currentUrl, key);
				} else {
					const cData = extractCoverDataFromDocument(document, config, targetDomain);
					if (cData && isCoverDataValid(cData)) {
						await GM_setCachedValue(currentUrl, cData);
					}
				}
				break;
			}
		}
	}
	async function main() {
		await checkDataVersion();
		showDetails = await GM.getValue("showDetails");
		showDescription = await GM.getValue("showDescription");
		showSmaller = await GM.getValue("showSmaller");
		useReadingListIconAndTitle = await GM.getValue("useReadingListIconAndTitle");
		showIconNextToLink = await GM.getValue("showIconNextToLink");
		if (showDetails === undefined || showDetails == "undefined") {
			showDetails = true;
		}
		if (showDescription === undefined || showDescription == "undefined") {
			showDescription = false;
		}
		if (showSmaller === undefined || showSmaller == "undefined") {
			showSmaller = false;
		}
		if (
			useReadingListIconAndTitle === undefined ||
			useReadingListIconAndTitle == "undefined"
		) {
			useReadingListIconAndTitle = true;
		}
		if (showIconNextToLink === undefined || showIconNextToLink == "undefined") {
			showIconNextToLink = defaultShowIconNextToLink;
		}
		addStyles();
		createPopUp();
		changeToNewDetailStyle(false);
		await preloadCoverData();
		prepareEventListener();
		await cacheCurrentPage();
	}
})();
