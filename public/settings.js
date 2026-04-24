import browser from "webextension-polyfill";

const urlListInput = document.getElementById("urlList");
const saveBtn = document.getElementById("saveBtn");
const statusMessage = document.getElementById("statusMessage");

async function loadSettings() {
  const data = await browser.storage.local.get({ customUrls: [] });
  urlListInput.value = data.customUrls.join("\n");
}

async function saveSettings() {
  const rawUrls = urlListInput.value.split("\n");
  const cleanUrls = rawUrls
    .map((url) => url.trim())
    .filter((url) => url !== "");

  await browser.storage.local.set({ customUrls: cleanUrls });

  // Show success message
  statusMessage.style.opacity = "1";
  setTimeout(() => {
    statusMessage.style.opacity = "0";
  }, 2000);
}

document.addEventListener("DOMContentLoaded", loadSettings);
saveBtn.addEventListener("click", saveSettings);
