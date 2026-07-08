import { CARS, DEFAULT_PROFILE, GLOBAL_SOURCES, SNAPSHOT_DATE } from "../data/cars.js";
import {
  annualRoadTax,
  calculateTco,
  explainRecommendation,
  formatMoney,
  formatNumber,
  scoreCars,
  selectRecommendations
} from "./engine.js";

const STORAGE_KEY = "car-decided-sg-v1";
const WEIGHTS = [
  ["reliability", "Reliability"],
  ["safety", "Safety"],
  ["comfort", "Comfort"],
  ["technology", "Technology"],
  ["performance", "Performance"],
  ["value", "10-year value"],
  ["service", "Service support"],
  ["space", "Family space"]
];
const BRAND_COLORS = {
  Tesla: "#d9e2e6",
  XPENG: "#8cf0ec",
  BYD: "#cfb0ff",
  Kia: "#a8ef8b",
  Volvo: "#9fc6ff",
  Honda: "#ff9e78"
};

const clone = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[char]));

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) throw new Error("No saved state");
    return {
      profile: {
        ...clone(DEFAULT_PROFILE),
        ...saved.profile,
        weights: { ...DEFAULT_PROFILE.weights, ...(saved.profile?.weights || {}) }
      },
      overrides: saved.overrides || {},
      compareIds: Array.isArray(saved.compareIds) ? saved.compareIds.filter(id => CARS.some(car => car.id === id)).slice(0, 4) : []
    };
  } catch {
    return { profile: clone(DEFAULT_PROFILE), overrides: {}, compareIds: [] };
  }
}

let state = loadState();
let activeView = "fit";
let activeOverrideId = null;
let toastTimer;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const carById = id => CARS.find(car => car.id === id);
const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

function scoredCars() {
  return scoreCars(CARS, state.profile, state.overrides);
}

function navigate(view) {
  activeView = view;
  $$(".view").forEach(element => element.classList.toggle("active", element.id === `view-${view}`));
  $$(".tabs [data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  if (view === "match") renderMatch();
  if (view === "compare") renderCompare();
  if (view === "evidence") renderEvidence();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function priceAge(car) {
  const age = Math.max(0, Math.floor((Date.parse(`${SNAPSHOT_DATE}T00:00:00Z`) - Date.parse(`${car.priceDate}T00:00:00Z`)) / 86400000));
  if (age > 60) return { label: `${age}d old · verify`, className: "stale" };
  if (age > 21) return { label: `${age}d old`, className: "stale" };
  return { label: age === 0 ? "checked today" : `${age}d old`, className: "" };
}

function renderWeights() {
  $("#weights-list").innerHTML = WEIGHTS.map(([key, label]) => `
    <div class="weight-row">
      <label for="weight-${key}">${esc(label)}</label>
      <input id="weight-${key}" data-weight="${key}" type="range" min="0" max="100" step="5" value="${state.profile.weights[key]}">
      <output>${state.profile.weights[key]}</output>
    </div>`).join("");
  $$("[data-weight]").forEach(input => input.addEventListener("input", event => {
    const key = event.currentTarget.dataset.weight;
    state.profile.weights[key] = Number(event.currentTarget.value);
    event.currentTarget.nextElementSibling.textContent = event.currentTarget.value;
    saveState();
  }));
}

function riskLabel(value) {
  if (value < 30) return "Proven brands";
  if (value < 70) return "Balanced";
  return "Adventurous";
}

function renderSignalSummary() {
  const profile = state.profile;
  $("#annual-km-output").textContent = `${formatNumber(profile.annualKm)} km`;
  $("#passengers-output").textContent = `${profile.passengers} ${profile.passengers === 1 ? "adult" : "adults"}`;
  $("#budget-output").textContent = formatMoney(profile.maxPurchasePrice);
  $("#risk-output").textContent = riskLabel(profile.riskTolerance);
  $("#signal-summary").innerHTML = [
    ["Use", "Commute + family"],
    ["People", `${profile.passengers} adults`],
    ["Power", profile.powertrain],
    ["Charging", profile.homeCharging ? "Home ready" : "Public only"]
  ].map(([label, value]) => `<div class="signal-chip"><small>${label}</small><b>${esc(value)}</b></div>`).join("");
}

function bindFitControls() {
  const bindings = [
    ["#annual-km", "annualKm"],
    ["#passengers", "passengers"],
    ["#budget", "maxPurchasePrice"],
    ["#risk", "riskTolerance"]
  ];
  bindings.forEach(([selector, key]) => {
    const input = $(selector);
    input.value = state.profile[key];
    input.addEventListener("input", () => {
      state.profile[key] = Number(input.value);
      renderSignalSummary();
      saveState();
    });
  });
  $("#home-charging").checked = state.profile.homeCharging;
  $("#home-charging").addEventListener("change", event => {
    state.profile.homeCharging = event.currentTarget.checked;
    renderSignalSummary();
    saveState();
  });
  $$("#powertrain-options button").forEach(button => {
    button.classList.toggle("active", button.dataset.value === state.profile.powertrain);
    button.addEventListener("click", () => {
      state.profile.powertrain = button.dataset.value;
      $$("#powertrain-options button").forEach(item => item.classList.toggle("active", item === button));
      renderSignalSummary();
      saveState();
    });
  });
}

function vehicleGraphic(car) {
  return `<div class="vehicle-visual" style="--car-accent:${BRAND_COLORS[car.brand] || "#d5f5f6"}">
    <div class="vehicle-body"></div><div class="vehicle-glass"></div><i class="wheel a"></i><i class="wheel b"></i>
  </div>`;
}

function renderMatch() {
  const scored = scoredCars();
  const { winner, heart, wildcard } = selectRecommendations(scored);
  const explanation = explainRecommendation(winner);
  if (!state.compareIds.length) state.compareIds = [winner.car.id, heart.car.id, wildcard.car.id];
  saveState();
  $("#match-summary").textContent = `Evaluated ${CARS.length} new SUVs against ${formatNumber(state.profile.annualKm)} km/year, ${state.profile.passengers} passengers and a ${formatMoney(state.profile.maxPurchasePrice)} purchase ceiling.`;
  $("#winner-region").innerHTML = `
    <div class="winner-layout">
      <article class="winner-hero">
        <div class="winner-stats"><div class="fit-score"><small>Your fit score</small><strong>${Math.round(winner.score)}</strong><span>%</span></div><div class="tco-stat"><small>Calculated ${state.profile.years}-year TCO</small><strong>${formatMoney(winner.tco.total)}</strong><small>${formatMoney(winner.tco.monthly)} / month equivalent</small></div></div>
        ${vehicleGraphic(winner.car)}
        <div class="winner-name"><div class="rank">01 · Best overall match · ${winner.car.powertrain}</div><h2>${esc(winner.car.brand)} ${esc(winner.car.model)}</h2><p>${esc(winner.car.variant)} · Cat ${winner.car.category} · ${winner.car.seats} seats</p></div>
      </article>
      <aside class="verdict-stack">
        <div class="verdict-card"><small>The verdict</small><h2>${esc(explanation.headline)}</h2><p>It wins under your weights and current cost assumptions—not because it is universally “best.”</p></div>
        ${explanation.reasons.slice(0, 2).map((reason, index) => `<div class="reason-card"><i>0${index + 1}</i><div><b>${esc(reason.title)}</b><p>${esc(reason.detail)}</p></div></div>`).join("")}
        <div class="caveat-card"><b>WATCH-OUT //</b> ${esc(explanation.caveat)} ${winner.adjustments.length ? `Additional adjustment: ${esc(winner.adjustments.join(", "))}.` : ""}</div>
      </aside>
    </div>`;
  const alternatives = [
    ["Heart-led alternative", heart, "Higher technology/performance character under your current shortlist."],
    ["Wildcard", wildcard, `A ${wildcard.car.powertrain.toLowerCase()} path with a meaningfully different ownership trade-off.`]
  ];
  $("#alternatives-region").innerHTML = alternatives.map(([label, item, detail]) => `
    <article class="alternative-card"><div><small>${label}</small><h3>${esc(item.car.brand)} ${esc(item.car.model)}</h3><p>${esc(detail)} ${formatMoney(item.tco.total)} over ${state.profile.years} years.</p></div><strong>${Math.round(item.score)}</strong></article>`).join("");
}

function ensureCompareIds() {
  if (state.compareIds.length) return;
  const recs = selectRecommendations(scoredCars());
  state.compareIds = [recs.winner.car.id, recs.heart.car.id, recs.wildcard.car.id];
  saveState();
}

function scoreForCar(id) {
  return scoredCars().find(item => item.car.id === id);
}

function renderAddCarOptions() {
  const available = CARS.filter(car => !state.compareIds.includes(car.id));
  $("#add-car-select").innerHTML = available.length
    ? available.map(car => `<option value="${car.id}">${esc(car.brand)} ${esc(car.model)} — ${esc(car.variant)}</option>`).join("")
    : `<option value="">All cars added</option>`;
  $("#add-car-btn").disabled = !available.length || state.compareIds.length >= 4;
}

function renderCompare() {
  ensureCompareIds();
  const ranked = scoredCars();
  const winnerId = ranked[0].car.id;
  const cards = state.compareIds.map(id => ranked.find(item => item.car.id === id)).filter(Boolean);
  const grid = $("#compare-grid");
  grid.style.setProperty("--compare-count", cards.length);
  grid.innerHTML = cards.map(item => {
    const car = item.car;
    const age = priceAge(car);
    return `<article class="compare-card ${car.id === winnerId ? "best" : ""}">
      <header><div><small>${car.id === winnerId ? "Recommended" : `${car.powertrain} · Cat ${car.category}`}</small><h3>${esc(car.brand)} ${esc(car.model)}</h3><p>${esc(car.variant)}</p></div><button class="remove-car" data-remove-car="${car.id}" aria-label="Remove ${esc(car.model)}">×</button></header>
      <div class="compare-metric"><span>Your match</span><strong class="cyan">${Math.round(item.score)} / 100</strong></div>
      <div class="compare-metric"><span>${state.profile.years}-year TCO</span><strong>${formatMoney(item.tco.total)}</strong></div>
      <div class="compare-metric"><span>Monthly equivalent</span><strong>${formatMoney(item.tco.monthly)}</strong></div>
      <div class="compare-metric"><span>Purchase snapshot</span><strong>${formatMoney(item.tco.assumptions.price)}</strong></div>
      <div class="compare-metric"><span>Annual energy</span><strong>${formatMoney(item.tco.assumptions.energyAnnual)}</strong></div>
      <div class="compare-metric"><span>Annual road tax</span><strong>${formatMoney(item.tco.assumptions.roadTaxAnnual)}</strong></div>
      <div class="compare-metric"><span>Technology</span><span class="metric-bar"><i style="width:${item.dimensions.technology}%"></i></span></div>
      <div class="compare-metric"><span>Safety</span><span class="metric-bar"><i style="width:${item.dimensions.safety}%"></i></span></div>
      <div class="compare-metric"><span>Family space</span><span class="metric-bar"><i style="width:${item.dimensions.space}%"></i></span></div>
      <footer><button data-edit-car="${car.id}">Edit car assumptions →</button><span class="freshness ${age.className}">${age.label}</span></footer>
    </article>`;
  }).join("") || `<div class="empty-state">Add a car to begin comparing.</div>`;
  renderAddCarOptions();
  renderSharedAssumptions();
}

function renderSharedAssumptions() {
  const fields = {
    "electricity-price": "electricityPrice",
    "petrol-price": "petrolPrice",
    "loan-percent": "loanPercent",
    "loan-rate": "loanRate",
    "loan-years": "loanYears",
    "parking-monthly": "parkingMonthly",
    "erp-annual": "erpAnnual",
    "charger-cost": "chargerCost"
  };
  Object.entries(fields).forEach(([id, key]) => { $("#" + id).value = state.profile[key]; });
}

function openOverride(id) {
  const car = carById(id);
  const tco = calculateTco(car, state.profile, state.overrides[id]);
  activeOverrideId = id;
  $("#override-title").textContent = `${car.brand} ${car.model}`;
  const form = $("#override-form");
  Object.entries(tco.assumptions).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = Math.round(value);
  });
  $("#override-dialog").showModal();
}

function sourceCard(source) {
  return `<article class="source-card"><div class="source-top"><span class="source-type ${esc(source.type)}">${esc(source.type)}</span><span class="source-date">Checked ${esc(source.checked)}</span></div><h3>${esc(source.title)}</h3><p>${esc(source.note || source.publisher)}</p><a href="${esc(source.url)}" target="_blank" rel="noopener">Open source ↗</a></article>`;
}

function renderEvidenceCarOptions() {
  const select = $("#evidence-car-select");
  const previous = select.value || scoredCars()[0].car.id;
  select.innerHTML = CARS.map(car => `<option value="${car.id}">${esc(car.brand)} ${esc(car.model)} — ${esc(car.variant)}</option>`).join("");
  select.value = CARS.some(car => car.id === previous) ? previous : CARS[0].id;
}

function renderCarEvidence(id) {
  const item = scoreForCar(id) || scoredCars()[0];
  const car = item.car;
  const socialLinks = car.social.sources.length
    ? `<ul>${car.social.sources.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)} ↗</a></li>`).join("")}</ul>`
    : `<p>No linked Singapore owner thread met the v1 inclusion threshold. Social confidence remains low.</p>`;
  $("#car-evidence").innerHTML = `
    <section class="evidence-summary"><small>${esc(car.source.type)} specification · ${esc(car.priceConfidence)} price confidence</small><h3>${esc(car.brand)} ${esc(car.model)}</h3><p>${esc(car.priceNote)} Current recommendation score: ${Math.round(item.score)}/100.</p><div class="spec-strip"><div class="spec"><small>Range</small><b>${car.rangeKm ? `${car.rangeKm} km` : "N/A"}</b></div><div class="spec"><small>Consumption</small><b>${car.consumption} ${esc(car.consumptionUnit)}</b></div><div class="spec"><small>Cargo</small><b>${car.cargoL} L</b></div><div class="spec"><small>Warranty</small><b>${car.warrantyYears} yr</b></div></div></section>
    <div class="signal-cards">
      ${sourceCard({ ...car.source, note: `${car.variant} specifications and features.` })}
      ${sourceCard({ ...car.priceSource, note: car.priceNote })}
      <article class="owner-signal"><header><span class="source-type social">Owner signal</span><span class="source-date">${esc(car.social.confidence)} confidence</span></header><h3>${esc(car.social.positive)}</h3><p><b>Watch-out:</b> ${esc(car.social.concern)}</p>${socialLinks}</article>
    </div>`;
}

function renderEvidence() {
  $("#global-evidence").innerHTML = GLOBAL_SOURCES.map(sourceCard).join("");
  renderEvidenceCarOptions();
  renderCarEvidence($("#evidence-car-select").value);
}

function bindEvents() {
  $$(".tabs [data-view]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
  $$('[data-jump]').forEach(button => button.addEventListener("click", () => navigate(button.dataset.jump)));
  $("#run-match").addEventListener("click", () => { renderMatch(); navigate("match"); showToast("Match recalculated from your priorities"); });
  $("#add-car-btn").addEventListener("click", () => {
    const id = $("#add-car-select").value;
    if (!id || state.compareIds.includes(id)) return;
    if (state.compareIds.length >= 4) return showToast("Comparison is limited to four cars");
    state.compareIds.push(id); saveState(); renderCompare();
  });
  $("#compare-grid").addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-car]");
    const remove = event.target.closest("[data-remove-car]");
    if (edit) openOverride(edit.dataset.editCar);
    if (remove) { state.compareIds = state.compareIds.filter(id => id !== remove.dataset.removeCar); saveState(); renderCompare(); }
  });
  const sharedFields = {
    "electricity-price": "electricityPrice", "petrol-price": "petrolPrice", "loan-percent": "loanPercent", "loan-rate": "loanRate",
    "loan-years": "loanYears", "parking-monthly": "parkingMonthly", "erp-annual": "erpAnnual", "charger-cost": "chargerCost"
  };
  Object.entries(sharedFields).forEach(([id, key]) => $("#" + id).addEventListener("change", event => {
    state.profile[key] = Number(event.currentTarget.value); saveState(); renderCompare(); renderMatch(); showToast("TCO assumptions updated");
  }));
  $("#reset-overrides").addEventListener("click", () => { state.overrides = {}; saveState(); renderCompare(); showToast("Car overrides reset"); });
  $("#save-override").addEventListener("click", () => {
    const form = $("#override-form");
    const values = {};
    ["price", "roadTaxAnnual", "insuranceAnnual", "maintenanceAnnual", "repairReserveAnnual", "residualValue"].forEach(key => { values[key] = Number(form.elements[key].value); });
    state.overrides[activeOverrideId] = values; saveState(); $("#override-dialog").close(); renderCompare(); renderMatch(); showToast("Car assumptions saved");
  });
  $$('[data-close-override]').forEach(button => button.addEventListener("click", () => $("#override-dialog").close()));
  $("#evidence-car-select").addEventListener("change", event => renderCarEvidence(event.currentTarget.value));
  $("#about-btn").addEventListener("click", () => $("#about-dialog").showModal());
  $("#reset-btn").addEventListener("click", () => {
    if (!window.confirm("Reset all preferences, comparisons and overrides?")) return;
    state = { profile: clone(DEFAULT_PROFILE), overrides: {}, compareIds: [] };
    saveState(); location.reload();
  });
}

function init() {
  $("#coverage-count").textContent = CARS.length;
  renderWeights();
  bindFitControls();
  renderSignalSummary();
  bindEvents();
  renderMatch();
  renderCompare();
  renderEvidence();
}

init();
