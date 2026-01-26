import { createInitialState, computeForecast, simulateTick } from "./data.js";
import { initState, getState, setState, updateState, subscribe } from "./state.js";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from "./utils.js";
import { renderSparkline } from "./charts.js";

const LIVE_INTERVAL_MS = 8000;

const uiState = {
  searchTerm: "",
  region: "all",
  sortKey: "sales",
  sortDir: "desc",
};

const elements = {
  themeToggle: document.getElementById("themeToggle"),
  liveToggle: document.getElementById("liveToggle"),
  snapshotBtn: document.getElementById("snapshotBtn"),
  resetFiltersBtn: document.getElementById("resetFiltersBtn"),
  lastUpdated: document.getElementById("lastUpdated"),
  healthDelivery: document.getElementById("healthDelivery"),
  healthBackorder: document.getElementById("healthBackorder"),
  healthSentiment: document.getElementById("healthSentiment"),
  storeSearch: document.getElementById("storeSearch"),
  regionFilter: document.getElementById("regionFilter"),
  storeTableBody: document.getElementById("storeTableBody"),
  alertList: document.getElementById("alertList"),
  pipelineGrid: document.getElementById("pipelineGrid"),
  demandSlider: document.getElementById("demandSlider"),
  demandValue: document.getElementById("demandValue"),
  forecastSales: document.getElementById("forecastSales"),
  forecastOrders: document.getElementById("forecastOrders"),
  forecastMargin: document.getElementById("forecastMargin"),
};

const metricElements = {
  sales: {
    value: document.getElementById("metric-sales-value"),
    delta: document.getElementById("metric-sales-delta"),
    target: document.getElementById("metric-sales-target"),
    chart: document.getElementById("metric-sales-chart"),
    color: "#6366f1",
  },
  conversion: {
    value: document.getElementById("metric-conversion-value"),
    delta: document.getElementById("metric-conversion-delta"),
    target: document.getElementById("metric-conversion-target"),
    chart: document.getElementById("metric-conversion-chart"),
    color: "#10b981",
  },
  orders: {
    value: document.getElementById("metric-orders-value"),
    delta: document.getElementById("metric-orders-delta"),
    target: document.getElementById("metric-orders-target"),
    chart: document.getElementById("metric-orders-chart"),
    color: "#38bdf8",
  },
  inventory: {
    value: document.getElementById("metric-inventory-value"),
    delta: document.getElementById("metric-inventory-delta"),
    target: document.getElementById("metric-inventory-target"),
    chart: document.getElementById("metric-inventory-chart"),
    color: "#f97316",
  },
};

let liveIntervalId = null;

const applyTheme = (theme) => {
  document.body.dataset.theme = theme;
  elements.themeToggle.textContent =
    theme === "dark" ? "Switch to Light" : "Switch to Dark";
  localStorage.setItem("retailops-theme", theme);
};

const initTheme = () => {
  const savedTheme = localStorage.getItem("retailops-theme");
  if (savedTheme) {
    applyTheme(savedTheme);
    return;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
};

const toggleTheme = () => {
  const currentTheme = document.body.dataset.theme || "dark";
  applyTheme(currentTheme === "dark" ? "light" : "dark");
};

const startLiveUpdates = () => {
  if (liveIntervalId) {
    return;
  }
  liveIntervalId = window.setInterval(() => {
    updateState(simulateTick);
  }, LIVE_INTERVAL_MS);
};

const stopLiveUpdates = () => {
  if (liveIntervalId) {
    window.clearInterval(liveIntervalId);
    liveIntervalId = null;
  }
};

const setLiveMode = (enabled) => {
  const state = getState();
  setState({ ...state, live: enabled });
  elements.liveToggle.setAttribute("aria-pressed", enabled ? "true" : "false");
  elements.liveToggle.textContent = enabled ? "Live: On" : "Live: Paused";
  if (enabled) {
    startLiveUpdates();
  } else {
    stopLiveUpdates();
  }
};

const formatMetricValue = (key, value) => {
  switch (key) {
    case "sales":
      return formatCompactCurrency(value);
    case "conversion":
    case "inventory":
      return formatPercent(value);
    case "orders":
      return formatNumber(value);
    default:
      return value;
  }
};

const renderMetrics = (metrics) => {
  Object.entries(metrics).forEach(([key, metric]) => {
    const element = metricElements[key];
    if (!element) {
      return;
    }
    element.value.textContent = formatMetricValue(key, metric.value);
    element.target.textContent = formatMetricValue(key, metric.target);
    element.delta.textContent = formatSignedPercent(metric.delta);
    element.delta.classList.toggle("up", metric.delta >= 0);
    element.delta.classList.toggle("down", metric.delta < 0);
    renderSparkline(element.chart, metric.series, {
      stroke: element.color,
      fill: `${element.color}33`,
    });
  });
};

const renderHealth = (health) => {
  elements.healthDelivery.textContent = formatPercent(health.delivery);
  elements.healthBackorder.textContent = formatPercent(health.backorder);
  elements.healthSentiment.textContent = formatPercent(health.sentiment);
};

const updateSortIndicators = () => {
  const headers = document.querySelectorAll("#storeTable th[data-sort]");
  headers.forEach((header) => {
    const isSorted = header.dataset.sort === uiState.sortKey;
    header.classList.toggle("sorted", isSorted);
    header.setAttribute(
      "aria-sort",
      isSorted ? (uiState.sortDir === "asc" ? "ascending" : "descending") : "none"
    );
  });
};

const getSortedStores = (stores) => {
  const sorted = [...stores].sort((first, second) => {
    const { sortKey, sortDir } = uiState;
    const modifier = sortDir === "asc" ? 1 : -1;
    const firstValue = first[sortKey];
    const secondValue = second[sortKey];
    if (typeof firstValue === "string") {
      return firstValue.localeCompare(secondValue) * modifier;
    }
    return (firstValue - secondValue) * modifier;
  });
  return sorted;
};

const renderStoreTable = (stores) => {
  const search = uiState.searchTerm.trim().toLowerCase();
  const filtered = stores.filter((store) => {
    const matchesRegion = uiState.region === "all" || store.region === uiState.region;
    const matchesSearch =
      !search ||
      store.name.toLowerCase().includes(search) ||
      store.city.toLowerCase().includes(search);
    return matchesRegion && matchesSearch;
  });

  const sorted = getSortedStores(filtered);
  elements.storeTableBody.innerHTML = "";

  sorted.forEach((store) => {
    const row = document.createElement("tr");
    const fulfillmentClass =
      store.fulfillment >= 0.93
        ? "success"
        : store.fulfillment >= 0.9
        ? "warning"
        : "danger";
    row.innerHTML = `
      <td>
        <div class="store-name">${store.name}</div>
        <div class="store-city">${store.city}</div>
      </td>
      <td>${formatCurrency(store.sales)}</td>
      <td>${formatPercent(store.conversion)}</td>
      <td>${formatPercent(store.inventory)}</td>
      <td><span class="badge ${fulfillmentClass}">${formatPercent(
        store.fulfillment
      )}</span></td>
    `;
    elements.storeTableBody.appendChild(row);
  });

  if (sorted.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="5" class="muted-cell">No stores match the filters.</td>
    `;
    elements.storeTableBody.appendChild(row);
  }

  updateSortIndicators();
};

const renderAlerts = (alerts) => {
  elements.alertList.innerHTML = "";
  alerts.forEach((alert) => {
    const listItem = document.createElement("li");
    listItem.className = "alert-item";
    listItem.innerHTML = `
      <div class="alert-meta">
        <span class="badge ${alert.severity}">${alert.severity.toUpperCase()}</span>
        <span>${formatDateTime(new Date(alert.time))}</span>
      </div>
      <h4>${alert.title}</h4>
      <p>${alert.description}</p>
    `;
    elements.alertList.appendChild(listItem);
  });
};

const renderPipeline = (pipeline) => {
  elements.pipelineGrid.innerHTML = "";
  pipeline.forEach((stage) => {
    const percent = Math.round((stage.value / stage.target) * 100);
    const card = document.createElement("div");
    card.className = "pipeline-card";
    card.innerHTML = `
      <div class="pipeline-title">${stage.stage}</div>
      <div class="progress-track">
        <div class="progress-bar" style="width: ${percent}%;"></div>
      </div>
      <div class="progress-meta">
        <span>${formatNumber(stage.value)} units</span>
        <span>${percent}% of target</span>
      </div>
    `;
    elements.pipelineGrid.appendChild(card);
  });
};

const renderScenario = (scenario) => {
  const upliftPercent = Math.round(scenario.demandUplift * 100);
  elements.demandSlider.value = upliftPercent;
  elements.demandValue.textContent = `${upliftPercent >= 0 ? "+" : ""}${upliftPercent}%`;

  const forecast = computeForecast(scenario);
  elements.forecastSales.textContent = formatCurrency(forecast.sales);
  elements.forecastOrders.textContent = formatNumber(forecast.orders);
  elements.forecastMargin.textContent = formatPercent(forecast.margin);
};

const renderTimestamp = (lastUpdated) => {
  elements.lastUpdated.textContent = formatDateTime(new Date(lastUpdated));
};

const render = (state) => {
  renderMetrics(state.metrics);
  renderHealth(state.health);
  renderStoreTable(state.stores);
  renderAlerts(state.alerts);
  renderPipeline(state.pipeline);
  renderScenario(state.scenario);
  renderTimestamp(state.lastUpdated);
};

const resetFilters = () => {
  uiState.searchTerm = "";
  uiState.region = "all";
  uiState.sortKey = "sales";
  uiState.sortDir = "desc";
  elements.storeSearch.value = "";
  elements.regionFilter.value = "all";
  renderStoreTable(getState().stores);
};

const exportSnapshot = () => {
  const snapshot = {
    generatedAt: new Date().toISOString(),
    ...getState(),
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `retailops-snapshot-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const registerEventHandlers = () => {
  elements.themeToggle.addEventListener("click", toggleTheme);

  elements.liveToggle.addEventListener("click", () => {
    setLiveMode(!getState().live);
  });

  elements.snapshotBtn.addEventListener("click", exportSnapshot);
  elements.resetFiltersBtn.addEventListener("click", resetFilters);

  elements.storeSearch.addEventListener("input", (event) => {
    uiState.searchTerm = event.target.value;
    renderStoreTable(getState().stores);
  });

  elements.regionFilter.addEventListener("change", (event) => {
    uiState.region = event.target.value;
    renderStoreTable(getState().stores);
  });

  document.querySelectorAll("#storeTable th[data-sort]").forEach((header) => {
    header.addEventListener("click", () => {
      const key = header.dataset.sort;
      if (uiState.sortKey === key) {
        uiState.sortDir = uiState.sortDir === "asc" ? "desc" : "asc";
      } else {
        uiState.sortKey = key;
        uiState.sortDir = "desc";
      }
      renderStoreTable(getState().stores);
    });
  });

  elements.demandSlider.addEventListener("input", (event) => {
    const uplift = Number(event.target.value) / 100;
    updateState((state) => ({
      ...state,
      scenario: {
        ...state.scenario,
        demandUplift: uplift,
      },
    }));
  });
};

const init = () => {
  initTheme();
  const initialState = createInitialState();
  initState(initialState);
  subscribe(render);
  render(initialState);
  registerEventHandlers();
  setLiveMode(true);
};

init();
