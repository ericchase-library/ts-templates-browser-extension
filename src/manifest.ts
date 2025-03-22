// do not remove any of these, they are generally required by addon stores
export const MANIFEST_REQUIRED: Record<string, any> = {
  manifest_version: 3,
  name: 'Browser Extension',
  version: '0.0.0',
  description: 'A Browser Extension',
  icons: {
    '16': 'assets/icon16.png',
    '48': 'assets/icon48.png',
    '128': 'assets/icon128.png',
  },
};

// these are optional and should work on each target browser
export const MANIFEST_OPTIONAL = {
  permissions: [],
  host_permissions: [],
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
  },
  action: {
    default_popup: 'popup/popup.html',
    default_icon: {
      '16': 'assets/icon16.png',
      '48': 'assets/icon48.png',
      '128': 'assets/icon128.png',
    },
  },
  content_scripts: [
    {
      matches: ['*://example.com/*'],
      js: ['content_scripts/content.script.js'],
      run_at: 'document_start',
    },
  ],
  web_accessible_resources: [],
};

// these are optional per browser keys
export const PER_BROWSER_MANIFEST_OPTIONAL = {
  chrome: {
    background: {
      service_worker: 'background.module.js',
      type: 'module',
    },
    minimum_chrome_version: '120',
  },
  firefox: {
    background: {
      scripts: ['background.module.js'],
      type: 'module',
    },
    browser_specific_settings: {
      gecko: {
        strict_min_version: '120.0',
      },
      gecko_android: {},
    },
  },
};

// these are per browser keys for the final addon package
export const PER_BROWSER_MANIFEST_PACKAGE = {
  firefox: {
    browser_specific_settings: {
      gecko: {
        // https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/#when-do-you-need-an-add-on-id
        // All Manifest V3 extensions need an add-on ID in their manifest.json when submitted to AMO.
        // For Manifest V2 extensions, you need to add an add-on ID for certain situations.
        id: '',
      },
    },
  },
};
