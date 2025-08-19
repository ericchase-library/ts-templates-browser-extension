// src/background.module.ts
import { BrowserName } from './lib/lib.env.module.js';
chrome.action.onClicked.addListener(async (currentTab) => {});
if (BrowserName === 'chrome') {
  chrome.contextMenus.create(
    {
      contexts: ['action'],
      id: 'action--open-store-page-chrome',
      title: 'Open Chrome Web Store Page',
    },
    () => {
      chrome.runtime.lastError;
    },
  );
}
if (BrowserName === 'firefox') {
  chrome.contextMenus.create(
    {
      contexts: ['action'],
      id: 'action--open-store-page-firefox',
      title: 'Open Firefox Browser Add-ons Page',
    },
    () => {
      chrome.runtime.lastError;
    },
  );
  chrome.contextMenus.create(
    {
      contexts: ['action'],
      id: 'action--open-extension-options',
      title: 'Options',
    },
    () => {
      chrome.runtime.lastError;
    },
  );
}
chrome.contextMenus.onClicked.addListener((info, currentTab) => {
  switch (info.menuItemId) {
    case 'action--open-store-page-chrome':
      chrome.tabs.create({ url: 'https://chromewebstore.google.com/' });
      break;
    case 'action--open-store-page-firefox':
      chrome.tabs.create({ url: 'https://addons.mozilla.org/en-US/firefox/' });
      break;
    case 'action--open-extension-options':
      chrome.runtime.openOptionsPage();
      break;
  }
});
