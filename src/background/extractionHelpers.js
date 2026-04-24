import browser from "webextension-polyfill";
import { getSettings } from "./global"

async function updateInterceptorStatus(enable) {
  try {
    await browser.scripting.unregisterContentScripts({ ids: ["stream-interceptor"] }).catch(() => {});

    if (enable) {
      const settings = await getSettings();
      const urlsToIntercept = settings.customUrls?.length > 0 ? settings.customUrls : ["<all_urls>"];

      await browser.scripting.registerContentScripts([{
        id: "stream-interceptor",
        js: ["interceptor.js"],
        matches: urlsToIntercept,
        runAt: "document_start",
        world: "MAIN",
        allFrames: true
      }]);
    }
  } catch (e) {
    console.error("Failed to update interceptor script:", e);
  }
}

browser.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  updateInterceptorStatus(settings.interceptCrypto);
});

browser.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  updateInterceptorStatus(settings.interceptCrypto);
});

browser.storage.onChanged.addListener(async (changes) => {
  if (changes.interceptCrypto || changes.customUrls) {
    const settings = await getSettings();
    updateInterceptorStatus(settings.interceptCrypto);
  }
});
