import { BrowserName } from './lib/lib.env.module.js';
import { LoadOptions, options } from './lib/lib.options.module.js';

// chrome.action.onClicked
// https://developer.chrome.com/docs/extensions/reference/api/action
// Use the chrome.action API to control the extension's icon in the Google
// Chrome toolbar.
//
// The action icons are displayed in the browser toolbar next to the omnibox.
// After installation, these appear in the extensions menu (the puzzle piece
// icon). Users can pin your extension icon to the toolbar.
chrome.action.onClicked.addListener(async (currentTab) => {
  // chrome.tabs.query
  // https://developer.chrome.com/docs/extensions/reference/api/tabs#method-query
  // Gets all tabs that have the specified properties, or all tabs if no
  // properties are specified.
});

if (BrowserName === 'chrome') {
  // Open Chrome Web Store Page
  chrome.contextMenus.create(
    {
      contexts: ['action'],
      id: 'action--open-store-page-chrome',
      title: 'Open Chrome Web Store Page',
    },
    () => {
      chrome.runtime.lastError; // ignore the errors
    },
  );
}

if (BrowserName === 'firefox') {
  // Open Firefox Browser Add-ons Page
  chrome.contextMenus.create(
    {
      contexts: ['action'],
      id: 'action--open-store-page-firefox',
      title: 'Open Firefox Browser Add-ons Page',
    },
    () => {
      chrome.runtime.lastError; // ignore the errors
    },
  );
  // Open Extension Options
  chrome.contextMenus.create(
    {
      contexts: ['action'],
      id: 'action--open-extension-options',
      title: 'Options',
    },
    () => {
      chrome.runtime.lastError; // ignore the errors
    },
  );
}

(async () => {
  await LoadOptions();
  chrome.contextMenus.create(
    {
      contexts: ['page'],
      id: 'page--reload-all-tabs-in-window',
      title: 'Reload All Tabs (in Window)',
      visible: options.show_page_context_menu_item,
    },
    () => {
      chrome.runtime.lastError; // ignore the errors
    },
  );
})();

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
