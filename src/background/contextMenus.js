import browser from "webextension-polyfill";
import SparkMD5 from "spark-md5";
import { getSettings } from "./global";

async function nativeHash(algorithm, text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const MENU_ITEMS = [
  { id: "kac_toolkit_parent", title: "KAC Toolkit" },

  {
    id: "kac_toolkit_base_parent",
    title: "Base64",
    parentId: "kac_toolkit_parent",
  },
  {
    id: "kac_base64_encode",
    title: "Base64 Encode",
    parentId: "kac_toolkit_base_parent",
  },
  {
    id: "kac_base64_decode",
    title: "Base64 Decode",
    parentId: "kac_toolkit_base_parent",
  },

  // URL
  {
    id: "kac_toolkit_url_parent",
    title: "URL",
    parentId: "kac_toolkit_parent",
  },
  {
    id: "kac_url_encode",
    title: "URL Encode",
    parentId: "kac_toolkit_url_parent",
  },
  {
    id: "kac_url_decode",
    title: "URL Decode",
    parentId: "kac_toolkit_url_parent",
  },

  {
    id: "kac_toolkit_hash_parent",
    title: "Hashes",
    parentId: "kac_toolkit_parent",
  },
  { id: "kac_hash_md5", title: "MD5", parentId: "kac_toolkit_hash_parent" },

  {
    id: "kac_toolkit_hash_sha_parent",
    title: "SHA",
    parentId: "kac_toolkit_hash_parent",
  },
  {
    id: "kac_hash_sha256",
    title: "SHA256",
    parentId: "kac_toolkit_hash_sha_parent",
  },
  {
    id: "kac_hash_sha512",
    title: "SHA512",
    parentId: "kac_toolkit_hash_sha_parent",
  },
];

const ACTIONS = {
  kac_base64_encode: (text) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(text))),
  kac_base64_decode: (text) =>
    new TextDecoder().decode(
      Uint8Array.from(atob(text), (c) => c.charCodeAt(0)),
    ),
  kac_url_encode: (text) => encodeURIComponent(text),
  kac_url_decode: (text) => decodeURIComponent(text),

  kac_hash_sha256: (text) => nativeHash("SHA-256", text),
  kac_hash_sha512: (text) => nativeHash("SHA-512", text),

  kac_hash_md5: (text) => SparkMD5.hash(text),
};

browser.runtime.onInstalled.addListener(async () => {
  try {
    await browser.contextMenus.removeAll();

    for (const item of MENU_ITEMS) {
      browser.contextMenus.create({
        ...item,
        contexts: ["selection"],
      });
    }
    console.log("Context menu items created successfully.");
  } catch (error) {
    console.error("Error creating context menus:", error);
  }
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const selectedText = info.selectionText;
  const menuId = info.menuItemId;
  const actionFunction = ACTIONS[menuId];

  if (!selectedText || !actionFunction) return;

  let resultText = "";

  try {
    resultText = await actionFunction(selectedText);
  } catch (e) {
    resultText = `ERROR: Operation failed. Text may be malformed or incompatible. (${e.message})`;
  }

  const settings = await getSettings();

  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content/modals.js"],
  });

  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: (original, result, settings) => {
      if (settings.onlyCopy) {
        navigator.clipboard.writeText(result).catch(console.error);
        showToast("Copied to clipboard!");
        return;
      }
      showModal(original, result, settings);
    },
    args: [selectedText, resultText, settings],
  });
});
