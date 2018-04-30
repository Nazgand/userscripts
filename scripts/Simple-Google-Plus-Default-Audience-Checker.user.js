// ==UserScript==
// @name     Simple Google Plus Default Audience Checker
// @namespace  http://tampermonkey.net/
// @version    0.1
// @description  Whenever Google+ has the default audience something other than what you want, this script will remind you to choose your audience.
// @author     Nazgand
// @match    https://plus.google.com/*
// @grant    none
// ==/UserScript==

//constants to minimize errors made by script
const svgCommunity = 'M18';
const svgPublic = 'M24 4';
const svgCircle = 'M33';
const svgPerson = 'M32';
const svgCollection = 'M24 2';


// BEGIN Changable constants ----------------------------------------
const defaultAudienceNameDesired = 'Public';
const defaultAudienceSvgDesired = svgPublic;
const frequencyToCheckForNewPost = 500;
const frequencyToCheckForButton = 50;
const patience = 4400;
// END   Changable constants ----------------------------------------


let lastContentPublishingBox = 0;
let beganWaiting = 0;
function waitForAndPress() { //Find the Audience Change button
  const shareWithButton = lastContentPublishingBox.querySelector('span[role="button"][aria-label^="Share with"]');
  //wait for the options to load, yet do not wait too long
  if (shareWithButton === null || Date.now() > beganWaiting + patience) {
    setTimeout(waitForAndPress, frequencyToCheckForButton);
  //Check to see whether change is needed while considering communities named 'Public'
  } else if (shareWithButton.attributes['aria-label'].value !== 'Share with: ' + defaultAudienceNameDesired
   || !shareWithButton.innerHTML.startsWith(defaultAudienceNameDesired)
   || !shareWithButton.querySelector('svg>path').attributes.d.value.startsWith(defaultAudienceSvgDesired)) {
    //click button to remind of need to change Audience
    shareWithButton.click();
  }
}
function main() {
  //check for new ContentPublishingBox
  const newContentPublishingBox = document.querySelector('c-wiz[role="dialog"]:not([aria-hidden])>c-wiz[data-av]>content');
  if (newContentPublishingBox !== null && lastContentPublishingBox !== newContentPublishingBox) {
    lastContentPublishingBox = newContentPublishingBox;
    beganWaiting = Date.now();
    waitForAndPress();
  }
  setTimeout(main, frequencyToCheckForNewPost);
}
main();
