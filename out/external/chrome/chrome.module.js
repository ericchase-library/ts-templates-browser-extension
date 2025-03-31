// src/lib/ericchase/Utility/Defer.ts
function Defer() {
  let resolve = (value) => {};
  let reject = (reason) => {};
  return {
    promise: new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }),
    resolve,
    reject
  };
}

// src/external/chrome/chrome.module.ts
function ChromeCallback() {
  const { promise, reject, resolve } = Defer();
  return {
    callback(data) {
      const error = chrome.runtime.lastError ?? undefined;
      if (error !== undefined) {
        reject(error);
      } else {
        resolve(data);
      }
    },
    promise
  };
}
export {
  ChromeCallback
};
