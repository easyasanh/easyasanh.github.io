const SHEET_ID = "1wCszUTW6zVxrTg_v-9K6RqJyds7lee4GeuevQxHrmGk";
const SHEET_NAME = "Sheet1";

// Google Visualization endpoint (works with "Anyone with the link" viewing)
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
  SHEET_NAME
)}`;

function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function formatDate(v) {
  // v may be a string like "2026-01-11" or empty
  if (!v) return "";
  return String(v);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function load() {
  const container = document.getElementById("restaurant-list");
  container.textContent = "Loading…";

  const res = await fetch(URL);
  const text = await res.text();

  // gviz wraps JSON in a function call; strip it out
  const json = JSON.parse(text.substring(47).slice(0, -2));
  const rows = json.table.rows || [];

  if (!rows.length) {
    container.textContent = "No rows yet — add some restaurants to the sheet 🙂";
    return;
  }

  container.innerHTML = "";

  rows.forEach((r) => {
    const cells = (r.c || []).map((c) => (c ? c.v : ""));

    // Your sheet order:
    const name = cells[0] ?? "";
    const city = cells[1] ?? "";
    const andrew = cells[2] ?? "";
    const nadia = cells[3] ?? "";
    const date = cells[4] ?? "";
    const notes = cells[5] ?? "";

    const nNadia = num(nadia);
    const nAndrew = num(andrew);
    const avg =
      nNadia !== null && nAndrew !== null ? ((nNadia + nAndrew) / 2).toFixed(1) : "—";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="top">
        <h2>${escapeHtml(name)}</h2>
        <div class="meta">
          <span>${escapeHtml(city)}</span>
          ${date ? `<span>• ${escapeHtml(formatDate(date))}</span>` : ""}
        </div>
      </div>

      <div class="scores">
        <div class="pill">Andrew: <strong>${escapeHtml(andrew)}</strong></div>
        <div class="pill">Nadia: <strong>${escapeHtml(nadia)}</strong></div>
        <div class="pill avg">Avg: <strong>${escapeHtml(avg)}</strong></div>
      </div>

      ${notes ? `<div class="notes">${escapeHtml(notes)}</div>` : ""}
    `;

    container.appendChild(card);
  });
}

load().catch((err) => {
  console.error(err);
  const container = document.getElementById("restaurant-list");
  container.textContent =
    "Couldn’t load the sheet";
});
