import browser from "webextension-polyfill";

const CHECKBOXES = [
  // { id: "autoCopyCheck", key: "autoCopy", defaultValue: false },
  { id: "onlyCopyCheck", key: "onlyCopy", defaultValue: true },
  { id: "interceptCryptoCheck", key: "interceptCrypto", defaultValue: false }
];

document.addEventListener("DOMContentLoaded", async () => {
  const defaults = Object.fromEntries(CHECKBOXES.map(({ key, defaultValue }) => [key, defaultValue]));

  const stored = browser.storage?.local
    ? await browser.storage.local.get(defaults)
    : defaults;

  for (const { id, key } of CHECKBOXES) {
    const checkbox = document.getElementById(id);
    if (!checkbox) continue;

    checkbox.checked = stored[key];

    checkbox.addEventListener("change", async () => {
      await browser.storage.local.set({ [key]: checkbox.checked });

      const textNode = Array.from(checkbox.parentNode.childNodes)
        .find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "");

      if (textNode) {
        const original = textNode.textContent;
        textNode.textContent = " Saved!";
        setTimeout(() => (textNode.textContent = original), 1000);
      }
    });
  }

  document.getElementById("openSettings")?.addEventListener("click", () => {
    browser.runtime.openOptionsPage();
  });
});
