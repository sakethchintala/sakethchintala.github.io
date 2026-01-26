import { clamp, createId } from "./utils.js";

const SERIES_LENGTH = 16;

const ALERT_TEMPLATES = [
  {
    severity: "warning",
    title: "Inventory dip detected",
    description: "Fast movers in the West region trending below safety stock.",
  },
  {
    severity: "danger",
    title: "Carrier delay risk",
    description: "Weather impact expected on two primary distribution lanes.",
  },
  {
    severity: "success",
    title: "Conversion lift sustained",
    description: "New merchandising layout holding above target for 3 hours.",
  },
  {
    severity: "warning",
    title: "Labor utilization high",
    description: "Pick-and-pack utilization at 92%, consider rebalancing.",
  },
  {
    severity: "danger",
    title: "Refund spike",
    description: "Customer refunds increased 18% in the last 45 minutes.",
  },
];

const BASE_FORECAST = {
  sales: 2950000,
  orders: 46800,
  margin: 0.32,
};

const INITIAL_STORES = [
  {
    id: "SFO-017",
    name: "San Jose",
    city: "San Jose, CA",
    region: "West",
    sales: 420000,
    conversion: 0.045,
    inventory: 0.88,
    fulfillment: 0.94,
  },
  {
    id: "SEA-044",
    name: "Seattle",
    city: "Seattle, WA",
    region: "West",
    sales: 385000,
    conversion: 0.041,
    inventory: 0.86,
    fulfillment: 0.92,
  },
  {
    id: "DAL-311",
    name: "Dallas",
    city: "Dallas, TX",
    region: "South",
    sales: 410000,
    conversion: 0.039,
    inventory: 0.84,
    fulfillment: 0.9,
  },
  {
    id: "ATL-206",
    name: "Atlanta",
    city: "Atlanta, GA",
    region: "South",
    sales: 370000,
    conversion: 0.043,
    inventory: 0.82,
    fulfillment: 0.91,
  },
  {
    id: "CHI-118",
    name: "Chicago",
    city: "Chicago, IL",
    region: "Midwest",
    sales: 440000,
    conversion: 0.046,
    inventory: 0.89,
    fulfillment: 0.95,
  },
  {
    id: "DET-052",
    name: "Detroit",
    city: "Detroit, MI",
    region: "Midwest",
    sales: 310000,
    conversion: 0.037,
    inventory: 0.83,
    fulfillment: 0.88,
  },
  {
    id: "MSP-033",
    name: "Minneapolis",
    city: "Minneapolis, MN",
    region: "Midwest",
    sales: 298000,
    conversion: 0.038,
    inventory: 0.85,
    fulfillment: 0.9,
  },
  {
    id: "NYC-010",
    name: "Manhattan",
    city: "New York, NY",
    region: "Northeast",
    sales: 512000,
    conversion: 0.052,
    inventory: 0.9,
    fulfillment: 0.96,
  },
  {
    id: "BOS-066",
    name: "Boston",
    city: "Boston, MA",
    region: "Northeast",
    sales: 336000,
    conversion: 0.044,
    inventory: 0.87,
    fulfillment: 0.93,
  },
  {
    id: "PHL-054",
    name: "Philadelphia",
    city: "Philadelphia, PA",
    region: "Northeast",
    sales: 322000,
    conversion: 0.04,
    inventory: 0.84,
    fulfillment: 0.91,
  },
  {
    id: "DEN-090",
    name: "Denver",
    city: "Denver, CO",
    region: "West",
    sales: 295000,
    conversion: 0.036,
    inventory: 0.81,
    fulfillment: 0.89,
  },
  {
    id: "MIA-078",
    name: "Miami",
    city: "Miami, FL",
    region: "South",
    sales: 305000,
    conversion: 0.039,
    inventory: 0.83,
    fulfillment: 0.9,
  },
];

const INITIAL_PIPELINE = [
  { stage: "Order received", value: 18200, target: 20000 },
  { stage: "Picking", value: 14450, target: 16500 },
  { stage: "Packing", value: 12100, target: 14000 },
  { stage: "In transit", value: 21800, target: 23500 },
  { stage: "Delivered", value: 19750, target: 21000 },
];

const createSeries = (start, variance, min, max) => {
  const values = [start];
  for (let i = 1; i < SERIES_LENGTH; i += 1) {
    const change = (Math.random() - 0.5) * variance;
    values.push(clamp(values[i - 1] + change, min, max));
  }
  return values;
};

const driftValue = (value, target, variance, min, max) => {
  const pull = (target - value) * 0.04;
  const jitter = (Math.random() - 0.5) * variance;
  return clamp(value + pull + jitter, min, max);
};

export const createInitialState = () => {
  const now = new Date();
  return {
    lastUpdated: now,
    live: true,
    metrics: {
      sales: {
        value: 2650000,
        target: 2800000,
        series: createSeries(2600000, 65000, 2200000, 3200000),
        delta: 0,
        variance: 42000,
        min: 2000000,
        max: 3400000,
      },
      conversion: {
        value: 0.041,
        target: 0.045,
        series: createSeries(0.041, 0.004, 0.03, 0.06),
        delta: 0,
        variance: 0.002,
        min: 0.03,
        max: 0.06,
      },
      orders: {
        value: 45200,
        target: 47000,
        series: createSeries(44800, 900, 38000, 52000),
        delta: 0,
        variance: 700,
        min: 36000,
        max: 52000,
      },
      inventory: {
        value: 0.86,
        target: 0.9,
        series: createSeries(0.86, 0.025, 0.7, 0.98),
        delta: 0,
        variance: 0.012,
        min: 0.7,
        max: 0.98,
      },
    },
    stores: INITIAL_STORES,
    alerts: [
      {
        id: createId("alert"),
        severity: "warning",
        title: "Demand spike forecast",
        description: "South region click-through rising faster than inventory.",
        time: now,
      },
      {
        id: createId("alert"),
        severity: "success",
        title: "Route optimization complete",
        description: "Delivery windows improved by 12 minutes on average.",
        time: now,
      },
    ],
    pipeline: INITIAL_PIPELINE,
    scenario: {
      demandUplift: 0.03,
    },
    health: {
      delivery: 0.94,
      backorder: 0.06,
      sentiment: 0.82,
    },
  };
};

export const simulateTick = (state) => {
  const nextMetrics = Object.fromEntries(
    Object.entries(state.metrics).map(([key, metric]) => {
      const nextValue = driftValue(
        metric.value,
        metric.target,
        metric.variance,
        metric.min,
        metric.max
      );
      const delta = ((nextValue - metric.value) / metric.value) * 100;
      const nextSeries = [...metric.series.slice(1), nextValue];
      return [
        key,
        {
          ...metric,
          value: nextValue,
          delta,
          series: nextSeries,
        },
      ];
    })
  );

  const nextStores = state.stores.map((store) => ({
    ...store,
    sales: driftValue(store.sales, store.sales * 1.01, 12000, 220000, 520000),
    conversion: driftValue(
      store.conversion,
      store.conversion * 1.01,
      0.003,
      0.03,
      0.06
    ),
    inventory: driftValue(store.inventory, 0.88, 0.015, 0.7, 0.98),
    fulfillment: driftValue(store.fulfillment, 0.93, 0.01, 0.84, 0.98),
  }));

  const nextPipeline = state.pipeline.map((stage) => ({
    ...stage,
    value: Math.round(
      driftValue(stage.value, stage.target, stage.target * 0.05, 0, stage.target)
    ),
  }));

  const nextAlerts = (() => {
    if (Math.random() > 0.35) {
      return state.alerts;
    }
    const template = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)];
    const newAlert = {
      id: createId("alert"),
      ...template,
      time: new Date(),
    };
    return [newAlert, ...state.alerts].slice(0, 6);
  })();

  const nextHealth = {
    delivery: driftValue(state.health.delivery, 0.94, 0.01, 0.86, 0.98),
    backorder: driftValue(state.health.backorder, 0.06, 0.01, 0.02, 0.15),
    sentiment: driftValue(state.health.sentiment, 0.82, 0.015, 0.6, 0.95),
  };

  return {
    ...state,
    lastUpdated: new Date(),
    metrics: nextMetrics,
    stores: nextStores,
    pipeline: nextPipeline,
    alerts: nextAlerts,
    health: nextHealth,
  };
};

export const computeForecast = (scenario) => {
  const uplift = 1 + scenario.demandUplift;
  return {
    sales: BASE_FORECAST.sales * uplift,
    orders: BASE_FORECAST.orders * uplift,
    margin: clamp(BASE_FORECAST.margin + scenario.demandUplift * 0.12, 0.2, 0.45),
  };
};
