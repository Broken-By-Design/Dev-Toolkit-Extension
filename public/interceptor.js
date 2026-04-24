(function () {
  if (window.__KAC_INTERCEPTOR_ACTIVE) return;
  window.__KAC_INTERCEPTOR_ACTIVE = true;

  const nConsole = {
    log: console.log.bind(console),
    groupCollapsed: (console.groupCollapsed || console.log).bind(console),
    groupEnd: (console.groupEnd || function () {}).bind(console),
    trace: (console.trace || function () {}).bind(console),
  };

  nConsole.log(
    "%cKAC Toolkit: Interceptor Active (Crypto & Network)",
    "color: #4ade80; font-size: 14px; font-weight: bold;",
  );

  const originalImportKey = window.crypto.subtle.importKey;
  window.crypto.subtle.importKey = async function (
    format,
    keyData,
    algo,
    extractable,
    usages,
  ) {
    if (format === "raw") {
      try {
        const keyBytes = new Uint8Array(keyData);
        nConsole.groupCollapsed(
          "%c[KAC] Crypto Key Intercepted",
          "color: #facc15; font-weight: bold;",
        );
        nConsole.log("Raw Bytes:", keyBytes);
        nConsole.log("As Text:", new TextDecoder().decode(keyBytes));
        nConsole.trace("Triggered from:");
        nConsole.groupEnd();
      } catch (e) {
        nConsole.log("[KAC] Error decoding key:", e);
      }
    }
    return originalImportKey.apply(this, arguments);
  };

  const originalDigest = window.crypto.subtle.digest;
  window.crypto.subtle.digest = async function (algo, data) {
    nConsole.groupCollapsed(
      "%c[KAC] Hash/Digest Triggered",
      "color: #c084fc; font-weight: bold;",
    );
    nConsole.log("Algorithm:", algo);
    try {
      nConsole.log("Data (Text):", new TextDecoder().decode(data));
    } catch (e) {
      nConsole.log("Data (Bytes):", new Uint8Array(data));
    }
    nConsole.trace("Triggered from:");
    nConsole.groupEnd();
    return originalDigest.apply(this, arguments);
  };

  function logM3u8Detection(url, type, contentText) {
    nConsole.groupCollapsed(
      `%c[KAC] M3U8 Stream Detected (${type})`,
      "color: #e50914; font-size: 13px; font-weight: bold;",
    );
    nConsole.log("%cURL:", "font-weight:bold;", url);

    if (contentText && typeof contentText === "string") {
      const resolutions = contentText
        .split("\n")
        .filter((l) => l.includes("RESOLUTION="))
        .map((l) => l.match(/RESOLUTION=(\d+x\d+)/)?.[1] || "Unknown");

      if (resolutions.length > 0) {
        nConsole.log(
          "%cResolutions Available:",
          "font-weight:bold; color:#4ade80;",
          resolutions.join(", "),
        );
      }
    }

    nConsole.trace("Triggered from:");
    nConsole.groupEnd();
  }

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const req = args[0];
    const reqUrl =
      typeof req === "string"
        ? req
        : req instanceof Request
          ? req.url
          : req?.url || "unknown";

    const response = await originalFetch.apply(this, args);

    (async () => {
      try {
        const clone = response.clone();

        if (clone.type === "opaque") return;

        const contentType = (
          clone.headers.get("content-type") || ""
        ).toLowerCase();
        if (
          contentType.includes("video/mp4") ||
          contentType.includes("video/mp2t")
        )
          return;

        let isM3u8 =
          reqUrl.includes(".m3u8") || contentType.includes("mpegurl");

        const text = await clone.text();
        if (!isM3u8 && text.trim().startsWith("#EXTM3U")) {
          isM3u8 = true;
        }

        if (isM3u8) logM3u8Detection(reqUrl, "Fetch", text);
      } catch (e) {}
    })();

    return response;
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._kacUrl = url;

    this.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        try {
          const contentType = (
            this.getResponseHeader("Content-Type") || ""
          ).toLowerCase();
          const urlStr = String(this._kacUrl || "");
          let isM3u8 =
            urlStr.includes(".m3u8") || contentType.includes("mpegurl");
          let text = "";

          if (this.responseType === "arraybuffer" && this.response) {
            text = new TextDecoder().decode(this.response);
          } else if (this.responseType === "" || this.responseType === "text") {
            text = this.responseText;
          }

          if (
            !isM3u8 &&
            typeof text === "string" &&
            text.trim().startsWith("#EXTM3U")
          ) {
            isM3u8 = true;
          }

          if (isM3u8) logM3u8Detection(urlStr, "XHR", text);
        } catch (e) {}
      }
    });

    return originalXhrOpen.call(this, method, url, ...rest);
  };
})();
