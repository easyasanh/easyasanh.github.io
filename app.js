const SHEET_ID = "1wCszUTW6zVxrTg_v-9K6RqJyds7lee4GeuevQxHrmGk";
const SHEET_NAME = "Sheet1";
const MICHELIN_STAR_ICON =
  "https://guide.michelin.com/assets/images/icons/michelin-star_8519.svg";
const MICHELIN_BIB_ICON =
  "https://guide.michelin.com/assets/images/icons/MICHELINguide-symboleBibendum_COLOR_RGB.svg";

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

function getCellValue(row, index) {
  return row?.c?.[index]?.v ?? "";
}

function findColumnIndex(names) {
  const normalizedNames = names.map((name) => name.toLowerCase());
  return allColumns.findIndex((column) => {
    const label = String(column?.label ?? column?.id ?? "").trim().toLowerCase();
    return normalizedNames.includes(label);
  });
}

function getMichelinColumnIndex() {
  return findColumnIndex([
    "michelin",
    "michelin classification",
    "michelin award",
    "michelin guide",
    "guide"
  ]);
}

function parseMichelin(value) {
  const raw = String(value ?? "").trim();
  const normalized = raw.toLowerCase();

  if (!raw) {
    return null;
  }

  if (normalized.includes("bib")) {
    return {
      type: "bib",
      label: "Bib Gourmand",
      icon: MICHELIN_BIB_ICON,
      alt: "Michelin Bib Gourmand"
    };
  }

  const starMatch = normalized.match(/([123])\s*star/);
  const stars = starMatch
    ? Number(starMatch[1])
    : normalized === "star" || normalized === "michelin star"
      ? 1
      : null;

  if (stars) {
    return {
      type: "star",
      label: `${stars} Michelin ${stars === 1 ? "Star" : "Stars"}`,
      count: stars,
      icon: MICHELIN_STAR_ICON,
      alt: "Michelin Star"
    };
  }

  if (normalized.includes("selected")) {
    return {
      type: "guide",
      label: "Michelin"
    };
  }

  if (normalized.includes("guide")) {
    return {
      type: "guide",
      label: "Michelin"
    };
  }

  return {
    type: "custom",
    label: raw
  };
}

function renderMichelinBadge(michelin) {
  if (!michelin) {
    return "";
  }

  if (michelin.type === "bib") {
    return `
      <div class="michelin-badge michelin-badge--bib" aria-label="${escapeHtml(michelin.label)}">
        <img class="michelin-badge__icon michelin-badge__icon--bib" src="${michelin.icon}" alt="${escapeHtml(michelin.alt)}" />
      </div>
    `;
  }

  if (michelin.type === "star") {
    const starsMarkup = Array.from({ length: michelin.count }, () => {
      return `<img class="michelin-badge__icon michelin-badge__icon--star" src="${michelin.icon}" alt="${escapeHtml(michelin.alt)}" />`;
    }).join("");

    return `
      <div class="michelin-badge michelin-badge--star" aria-label="${escapeHtml(michelin.label)}">
        <span class="michelin-badge__stars">${starsMarkup}</span>
      </div>
    `;
  }

  if (michelin.type === "guide") {
    return `
      <div class="michelin-badge michelin-badge--guide" aria-label="${escapeHtml(michelin.label)}">
        <span class="michelin-badge__wordmark">${escapeHtml(michelin.label)}</span>
      </div>
    `;
  }

  return `
    <div class="michelin-badge michelin-badge--text" aria-label="${escapeHtml(michelin.label)}">
      <span class="michelin-badge__fallback">${escapeHtml(michelin.label)}</span>
    </div>
  `;
}

function sortRows(rows, sort) {
  return rows.slice().sort((a, b) => {
    const aName = getCellValue(a, 0);
    const bName = getCellValue(b, 0);
    const aCity = getCellValue(a, 1);
    const bCity = getCellValue(b, 1);
    const aAndrew = num(getCellValue(a, 2));
    const bAndrew = num(getCellValue(b, 2));
    const aNadia = num(getCellValue(a, 3));
    const bNadia = num(getCellValue(b, 3));
    const aAvg = aAndrew !== null && aNadia !== null ? (aAndrew + aNadia) / 2 : -Infinity;
    const bAvg = bAndrew !== null && bNadia !== null ? (bAndrew + bNadia) / 2 : -Infinity;

    switch (sort) {
      case "avg-desc":
        return bAvg - aAvg;
      case "avg-asc":
        return aAvg - bAvg;
      case "andrew-desc":
        return bAndrew - aAndrew;
      case "andrew-asc":
        return aAndrew - bAndrew;
      case "nadia-desc":
        return bNadia - aNadia;
      case "nadia-asc":
        return aNadia - bNadia;
      case "city-asc":
        return String(aCity).localeCompare(String(bCity));
      case "city-desc":
        return String(bCity).localeCompare(String(aCity));
      case "name-asc":
        return String(aName).localeCompare(String(bName));
      case "name-desc":
        return String(bName).localeCompare(String(aName));
      default:
        return 0;
    }
  });
}

let allRows = [];
let allColumns = [];

function renderRows(rows) {
  const container = document.getElementById("restaurant-list");
  const michelinColumnIndex = getMichelinColumnIndex();

  container.innerHTML = "";
  rows.forEach((row) => {
    const name = getCellValue(row, 0);
    const city = getCellValue(row, 1);
    const andrew = getCellValue(row, 2);
    const nadia = getCellValue(row, 3);
    const date = getCellValue(row, 4);
    const notes = getCellValue(row, 5);
    const michelinValue = michelinColumnIndex >= 0 ? getCellValue(row, michelinColumnIndex) : "";
    const michelin = parseMichelin(michelinValue);

    const nNadia = num(nadia);
    const nAndrew = num(andrew);
    const avg =
      nNadia !== null && nAndrew !== null ? ((nNadia + nAndrew) / 2).toFixed(1) : "-";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="top">
        <div class="card__title-row">
          <h2>
            <span class="card__name">${escapeHtml(name)}</span>
            ${renderMichelinBadge(michelin)}
          </h2>
        </div>
        <div class="meta">
          <span class="meta__location">📍 ${escapeHtml(city)}</span>
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

  rows = sortRows(rows, sort);

  renderRows(rows);
}

async function load() {
  const container = document.getElementById("restaurant-list");
  container.textContent = "Loading…";
  const res = await fetch(URL);
  const text = await res.text();
  const json = JSON.parse(text.substring(47).slice(0, -2));
  allColumns = json.table.cols || [];
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
