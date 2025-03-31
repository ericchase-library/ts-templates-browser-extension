import { Defer } from '../../lib/ericchase/Utility/Defer.js';

export function ChromeCallback() {
  const { promise, reject, resolve } = Defer<{ [key: string]: any }>();
  return {
    callback(data?: any) {
      const error = chrome.runtime.lastError ?? undefined;
      if (error !== undefined) {
        reject(error);
      } else {
        resolve(data);
      }
    },
    promise,
  };
}
