// ============================================================
// SERVER HEALTH CHECK
// Pings /health on load. If it fails or times out the desktop
// is off — show "Server unavailable" on server-dependent tools.
// ============================================================

const SERVER_TIMEOUT_MS = 4000;

async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function setServerStatus(online) {
  const badge     = document.getElementById("server-badge");
  const ytPanel   = document.getElementById("yt-panel");
  const gdsPanel  = document.getElementById("gds-panel");
  const heicPanel = document.getElementById("heic-panel");

  if (online) {
    badge.textContent  = "● Server online";
    badge.className    = "server-badge online";
    ytPanel.innerHTML  = buildYtForm();
    gdsPanel.innerHTML = buildGdsForm();
    heicPanel.innerHTML = buildHeicForm();
    attachYtHandler();
    attachGdsHandler();
    attachHeicHandler();
  } else {
    badge.textContent   = "● Server unavailable — desktop is offline";
    badge.className     = "server-badge offline";
    const msg           = "<p class='tool-unavailable'>This tool requires the server to be running.</p>";
    ytPanel.innerHTML   = msg;
    gdsPanel.innerHTML  = msg;
    heicPanel.innerHTML = msg;
  }
}

// ============================================================
// YT DOWNLOADER
// ============================================================

function buildYtForm() {
  return `
    <form id="yt-form">
      <input type="url" id="yt-url" placeholder="YouTube URL" required>
      <div class="format-toggle">
        <label><input type="radio" name="yt-format" value="mp3" checked> MP3</label>
        <label><input type="radio" name="yt-format" value="mp4"> MP4</label>
      </div>
      <button type="submit">Download</button>
    </form>
    <div id="yt-status"></div>
  `;
}

function attachYtHandler() {
  document.getElementById("yt-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const url    = document.getElementById("yt-url").value.trim();
    const format = document.querySelector('input[name="yt-format"]:checked').value;
    const status = document.getElementById("yt-status");

    status.textContent = "Downloading…";

    try {
      const res = await fetch(`${API_BASE}/yt/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format }),
      });

      if (!res.ok) {
        const err = await res.json();
        status.textContent = `Error: ${err.detail}`;
        return;
      }

      // Trigger browser download
      const blob     = await res.blob();
      const filename = res.headers.get("content-disposition")
        ?.match(/filename="?([^"]+)"?/)?.[1] ?? `download.${format}`;
      const a        = document.createElement("a");
      a.href         = URL.createObjectURL(blob);
      a.download     = filename;
      a.click();
      status.textContent = "Done!";
    } catch {
      status.textContent = "Request failed — is the server still running?";
    }
  });
}

// ============================================================
// GDS MENU SCRAPER
// ============================================================

function buildGdsForm() {
  return `
    <form id="gds-form">
      <div class="format-toggle">
        <label><input type="radio" name="gds-date" value="today" checked> Today</label>
        <label><input type="radio" name="gds-date" value="tomorrow"> Tomorrow</label>
      </div>
      <select id="gds-meal">
        <option value="breakfast">Breakfast</option>
        <option value="lunch" selected>Lunch</option>
        <option value="dinner">Dinner</option>
      </select>
      <button type="submit">Get Menu</button>
    </form>
    <div id="gds-result"></div>
  `;
}

function attachGdsHandler() {
  document.getElementById("gds-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const result   = document.getElementById("gds-result");
    const dateVal  = document.querySelector('input[name="gds-date"]:checked').value;
    const meal     = document.getElementById("gds-meal").value;

    result.textContent = "Fetching menu…";

    try {
      const res  = await fetch(`${API_BASE}/gds/menu?date=${dateVal}&meal=${meal}`);
      const data = await res.json();

      if (!res.ok) {
        result.textContent = `Error: ${data.detail}`;
        return;
      }

      if (!data.menu.length) {
        result.textContent = "No menu items found for that meal.";
        return;
      }

      result.innerHTML = data.menu.map(({ category, items }) => `
        <div class="gds-station">
          <h4>${category}</h4>
          <ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>
        </div>
      `).join("");
    } catch {
      result.textContent = "Request failed — is the server still running?";
    }
  });
}

// ============================================================
// HEIC CONVERTER
// ============================================================

function buildHeicForm() {
  return `
    <form id="heic-form">
      <label class="file-label">
        <input type="file" id="heic-files" accept=".heic,.HEIC,.heif,.HEIF" multiple required>
        <span>Choose HEIC file(s)</span>
      </label>
      <button type="submit">Convert to JPEG</button>
    </form>
    <div id="heic-status"></div>
  `;
}

function attachHeicHandler() {
  const input = document.getElementById("heic-files");

  // Update label to show selected file count
  input.addEventListener("change", () => {
    const label = input.nextElementSibling;
    label.textContent = input.files.length > 1
      ? `${input.files.length} files selected`
      : input.files[0]?.name ?? "Choose HEIC file(s)";
  });

  document.getElementById("heic-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("heic-status");
    const files  = input.files;

    if (!files.length) return;

    status.textContent = "Converting…";

    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    try {
      const res = await fetch(`${API_BASE}/heic/convert`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        status.textContent = `Error: ${err.detail}`;
        return;
      }

      const blob        = await res.blob();
      const isZip       = files.length > 1;
      const filename    = isZip ? "converted.zip" : `${files[0].name.replace(/\.heic$/i, "")}.jpg`;
      const a           = document.createElement("a");
      a.href            = URL.createObjectURL(blob);
      a.download        = filename;
      a.click();
      status.textContent = `Done! ${files.length} file(s) converted.`;
    } catch {
      status.textContent = "Request failed — is the server still running?";
    }
  });
}

// ============================================================
// CLIPBOARD → DOWNLOAD
// ============================================================

const clipboardModal    = document.getElementById("clipboard-modal");
const clipboardPasteArea = document.getElementById("clipboard-paste-area");
const clipboardStatus   = document.getElementById("clipboard-status");

document.getElementById("clipboard-open-btn").addEventListener("click", () => {
  clipboardModal.hidden = false;
  clipboardPasteArea.innerHTML = `<p class="paste-hint">Press <kbd>Cmd+V</kbd> / <kbd>Ctrl+V</kbd> to paste</p>`;
  clipboardStatus.textContent = "";
  // Listen for paste while modal is open
  document.addEventListener("paste", handleClipboardPaste);
});

document.getElementById("clipboard-close-btn").addEventListener("click", closeClipboardModal);

clipboardModal.addEventListener("click", (e) => {
  if (e.target === clipboardModal) closeClipboardModal();
});

function closeClipboardModal() {
  clipboardModal.hidden = true;
  document.removeEventListener("paste", handleClipboardPaste);
}

async function handleClipboardPaste(e) {
  const items = e.clipboardData?.items;
  if (!items) return;

  let imageItem = null;
  for (const item of items) {
    if (item.type.startsWith("image/")) { imageItem = item; break; }
  }

  if (!imageItem) {
    clipboardStatus.textContent = "No image found in clipboard — copy an image first.";
    clipboardStatus.className = "clipboard-status error";
    return;
  }

  const blob = imageItem.getAsFile();

  // Show preview
  const previewUrl = URL.createObjectURL(blob);
  clipboardPasteArea.innerHTML = `<img src="${previewUrl}" class="paste-preview" alt="Pasted image">`;
  clipboardStatus.textContent = "Uploading…";
  clipboardStatus.className = "clipboard-status";

  // Send to backend
  const formData = new FormData();
  formData.append("file", blob, `clipboard.${imageItem.type.split("/")[1]}`);

  try {
    const res = await fetch(`${API_BASE}/clipboard/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      clipboardStatus.textContent = `Error: ${err.detail}`;
      clipboardStatus.className = "clipboard-status error";
      return;
    }

    const dlBlob   = await res.blob();
    const filename = res.headers.get("content-disposition")
      ?.match(/filename="?([^"]+)"?/)?.[1] ?? "clipboard.png";
    const a        = document.createElement("a");
    a.href         = URL.createObjectURL(dlBlob);
    a.download     = filename;
    a.click();

    clipboardStatus.textContent = `Downloaded as ${filename}`;
    clipboardStatus.className = "clipboard-status success";
  } catch {
    clipboardStatus.textContent = "Request failed — is the server running?";
    clipboardStatus.className = "clipboard-status error";
  }
}

// ============================================================
// INIT
// ============================================================

checkServerHealth().then(setServerStatus);
