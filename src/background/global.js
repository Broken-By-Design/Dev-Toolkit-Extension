import browser from "webextension-polyfill";


const SETTINGS = {
  autoCopy: false,
  onlyCopy: true,
  customUrls: [],
  interceptCrypto: false,
};

export const getSettings = () => browser.storage.local.get(SETTINGS);
