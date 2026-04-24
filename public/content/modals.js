function showModal(original, result, settings) {
  document.getElementById("kac-toolkit-modal")?.remove();

  const host = document.createElement("div");
  host.id = "kac-toolkit-modal";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    .modal {
      position: fixed; inset: 0; display: grid; place-items: center;
      background: rgba(0,0,0,0.4); z-index: 2147483647;
      animation: fade 0.2s ease-out;
    }
    .box {
      background: #222; color: #fff; padding: 20px; border-radius: 6px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.5); font-family: system-ui, sans-serif;
      border: 1px solid #444; width: 320px; max-width: 85%;
    }
    h3 { margin: 0 0 12px 0; font-size: 16px; }
    label, #status { font-size: 13px; color: #aaa; }
    #status { color: #4ade80; margin-bottom: 12px; min-height: 15px; }
    pre {
      background: #111; padding: 10px; border-radius: 4px; border: 1px solid #333;
      margin: 4px 0 12px; word-break: break-all; white-space: pre-wrap; font-size: 13px;
    }
    button {
      background: #333; color: #fff; border: 1px solid #555; padding: 8px;
      border-radius: 4px; cursor: pointer; width: 100%; font-size: 14px; transition: 0.2s;
    }
    button:hover { background: #444; }
    @keyframes fade { from { opacity: 0; transform: translateY(15px); } }
  `;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="box">
      <h3>KAC Toolkit Result</h3>
      <label>Original:</label><pre id="orig"></pre>
      <label>Result:</label><pre id="res"></pre>
      <div id="status"></div>
      <button id="close">Close</button>
    </div>
  `;

  modal.querySelector("#orig").textContent = original;
  modal.querySelector("#res").textContent = result;
  modal.querySelector("#close").onclick = () => host.remove();

  shadow.append(style, modal);

  // if (settings.autoCopy) {
  const status = modal.querySelector("#status");
  navigator.clipboard
    .writeText(result)
    .then(() => {
      status.textContent = "Result has been copied to clipboard.";
    })
    .catch(() => {
      status.style.color = "#ff6b6b";
      status.textContent = "Failed to auto-copy.";
    });
  // }
}

function showToast(message, duration = 3000) {
  document.getElementById("kac-toolkit-toast")?.remove();

  const host = document.createElement("div");
  host.id = "kac-toolkit-toast";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #222;
      color: #fff;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.5);
      font-family: system-ui, sans-serif;
      font-size: 14px;
      z-index: 2147483647;
      border: 1px solid #444;
      opacity: 0;
      transform: translateY(15px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none; /* Lets clicks pass through */
    }
    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  shadow.append(style, toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => host.remove(), 300);
  }, duration);
}
