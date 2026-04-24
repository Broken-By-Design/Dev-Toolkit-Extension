(function () {
  if (window.__KAC_INTERCEPTOR_ACTIVE) return;
  window.__KAC_INTERCEPTOR_ACTIVE = true;

  console.log(
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
      const keyBytes = new Uint8Array(keyData);
      const textDecoder = new TextDecoder();
      console.groupCollapsed(
        "%c[KAC] Crypto Key Intercepted",
        "color: #facc15; font-weight: bold;",
      );
      console.log("Raw Bytes:", keyBytes);
      console.log("As Text:", textDecoder.decode(keyBytes));
      console.trace("Triggered from:");
      console.groupEnd();
    }
    return originalImportKey.apply(this, arguments);
  };

  const originalDigest = window.crypto.subtle.digest;
  window.crypto.subtle.digest = async function (algo, data) {
    console.groupCollapsed(
      "%c[KAC] Hash/Digest Triggered",
      "color: #c084fc; font-weight: bold;",
    );
    console.log("Algorithm:", algo);
    try {
      console.log("Data (Text):", new TextDecoder().decode(data));
    } catch (e) {
      console.log("Data (Bytes):", new Uint8Array(data));
    }
    console.trace("Triggered from:");
    console.groupEnd();
    return originalDigest.apply(this, arguments);
  };

  function logM3u8Detection(url, type, contentText) {
    console.groupCollapsed(
      `%c[KAC] M3U8 Stream Detected (${type})`,
      "color: #e50914; font-size: 13px; font-weight: bold;",
    );
    console.log("%cURL:", "font-weight:bold;", url);

    if (contentText) {
      const lines = contentText.split("\n");
      const resolutions = lines
        .filter((l) => l.includes("RESOLUTION="))
        .map((l) => l.match(/RESOLUTION=(\d+x\d+)/)?.[1] || "Unknown");

      if (resolutions.length > 0) {
        console.log(
          "%cResolutions Available:",
          "font-weight:bold; color:#4ade80;",
          resolutions.join(", "),
        );
      }
    }

    console.trace("Triggered from:");
    console.groupEnd();
  }

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const reqUrl =
      typeof args[0] === "string" ? args[0] : args[0]?.url || "unknown";
    const response = await originalFetch.apply(this, args);

    (async () => {
      try {
        const clone = response.clone();
        const contentType = (
          clone.headers.get("content-type") || ""
        ).toLowerCase();

        if (
          contentType.includes("video/mp4") ||
          contentType.includes("video/mp2t")
        )
          return;

        let isM3u8 = false;
        let text = "";

        if (reqUrl.includes(".m3u8") || contentType.includes("mpegurl")) {
          isM3u8 = true;
          text = await clone.text();
        } else {
          text = await clone.text();
          if (text.trim().startsWith("#EXTM3U")) {
            isM3u8 = true;
          }
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
          let isM3u8 = false;
          let text = "";

          if (
            (typeof this._kacUrl === "string" &&
              this._kacUrl.includes(".m3u8")) ||
            contentType.includes("mpegurl")
          ) {
            isM3u8 = true;
            if (this.responseType === "" || this.responseType === "text")
              text = this.responseText;
          } else if (this.responseType === "" || this.responseType === "text") {
            if (
              typeof this.responseText === "string" &&
              this.responseText.trim().startsWith("#EXTM3U")
            ) {
              isM3u8 = true;
              text = this.responseText;
            }
          }

          if (isM3u8) logM3u8Detection(this._kacUrl, "XHR", text);
        } catch (e) {}
      }
    });

    return originalXhrOpen.call(this, method, url, ...rest);
  };
})();
