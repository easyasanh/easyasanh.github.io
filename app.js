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

function sortRows(rows, sort) {
  return rows.slice().sort((a, b) => {
    const ac = (a.c || []).map((c) => (c ? c.v : ""));
    const bc = (b.c || []).map((c) => (c ? c.v : ""));
    const aName = ac[0] ?? "";
    const bName = bc[0] ?? "";
    const aCity = ac[1] ?? "";
    const bCity = bc[1] ?? "";
    const aAndrew = num(ac[2]);
    const bAndrew = num(bc[2]);
    const aNadia = num(ac[3]);
    const bNadia = num(bc[3]);
    const aAvg = aAndrew !== null && aNadia !== null ? (aAndrew + aNadia) / 2 : -Infinity;
    const bAvg = bAndrew !== null && bNadia !== null ? (bAndrew + bNadia) / 2 : -Infinity;

    switch (sort) {
      case "avg-desc": return bAvg - aAvg;
      case "avg-asc": return aAvg - bAvg;
      case "andrew-desc": return bAndrew - aAndrew;
      case "andrew-asc": return aAndrew - bAndrew;
      case "nadia-desc": return bNadia - aNadia;
      case "nadia-asc": return aNadia - bNadia;
      case "city-asc": return aCity.localeCompare(bCity);
      case "city-desc": return bCity.localeCompare(aCity);
      case "name-asc": return aName.localeCompare(bName);
      case "name-desc": return bName.localeCompare(aName);
      default: return 0;
    }
  });
}

let allRows = [];

function renderRows(rows) {
  const container = document.getElementById("restaurant-list");
  container.innerHTML = "";
  rows.forEach((r) => {
    const cells = (r.c || []).map((c) => (c ? c.v : ""));
    const name = cells[0] ?? "";
    const city = cells[1] ?? "";
    const andrew = cells[2] ?? "";
    const nadia = cells[3] ?? "";
    const date = cells[4] ?? "";
    const notes = cells[5] ?? "";

    const nNadia = num(nadia);
    const nAndrew = num(andrew);
    const avg =
      nNadia !== null && nAndrew !== null ? ((nNadia + nAndrew) / 2).toFixed(1) : "-";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="top">
        <h2>${escapeHtml(name)}</h2>
        <div class="meta">
          <span style="color:#6b705c;">📍 ${escapeHtml(city)}</span>
          ${date ? `<span>• ${escapeHtml(formatDate(date))}</span>` : ""}
        </div>
      </div>
      <div class="scores">
        Andrew: <strong>${escapeHtml(andrew)}</strong> &nbsp;|&nbsp;
        Nadia: <strong>${escapeHtml(nadia)}</strong>
        <span class="avg">&nbsp;Avg: <strong>${escapeHtml(avg)}</strong></span>
      </div>
      ${notes ? `<div class="notes">${escapeHtml(notes)}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

function filterAndSortRows() {
  const sort = document.getElementById("sort-select")?.value || "avg-desc";
  let rows = allRows.slice();

  // Sort
  rows = sortRows(rows, sort);

  renderRows(rows);
}

async function load() {
  const container = document.getElementById("restaurant-list");
  container.textContent = "Loading…";
  const res = await fetch(URL);
  const text = await res.text();
  const json = JSON.parse(text.substring(47).slice(0, -2));
  allRows = json.table.rows || [];

  if (!allRows.length) {
    container.textContent = "No rows yet - add some restaurants to the sheet 🙂";
    return;
  }

  filterAndSortRows();
}

document.addEventListener("DOMContentLoaded", () => {
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", filterAndSortRows);
  }
});

load().catch((err) => {
  console.error(err);
  const container = document.getElementById("restaurant-list");
  container.textContent = "Could not load data - please check your connection or try again later.";
});
