// src/manifest.ts
var MANIFEST_REQUIRED = {
  manifest_version: 3,
  name: "Browser Extension",
  version: "0.0.1",
  description: "A Browser Extension",
  icons: {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  }
};
var MANIFEST_OPTIONAL = {
  permissions: [],
  host_permissions: [],
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  },
  action: {
    default_popup: "popup/popup.html",
    default_icon: {
      "16": "assets/icon16.png",
      "48": "assets/icon48.png",
      "128": "assets/icon128.png"
    }
  },
  content_scripts: [
    {
      matches: ["*://example.com/*"],
      js: ["content_scripts/content.script.js"],
      run_at: "document_start"
    }
  ],
  web_accessible_resources: []
};
var PER_BROWSER_MANIFEST_OPTIONAL = {
  chrome: {
    background: {
      service_worker: "background.module.js",
      type: "module"
    },
    minimum_chrome_version: "120"
  },
  firefox: {
    background: {
      scripts: ["background.module.js"],
      type: "module"
    },
    browser_specific_settings: {
      gecko: {
        strict_min_version: "120.0"
      },
      gecko_android: {}
    }
  }
};
var PER_BROWSER_MANIFEST_PACKAGE = {
  firefox: {
    browser_specific_settings: {
      gecko: {
        id: ""
      }
    }
  }
};
export {
  PER_BROWSER_MANIFEST_PACKAGE,
  PER_BROWSER_MANIFEST_OPTIONAL,
  MANIFEST_REQUIRED,
  MANIFEST_OPTIONAL
};
