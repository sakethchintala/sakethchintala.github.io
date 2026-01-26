const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);

export const formatCompactCurrency = (value) =>
  `$${compactNumberFormatter.format(value)}`;

export const formatCurrency = (value) => currencyFormatter.format(value);

export const formatNumber = (value) => numberFormatter.format(value);

export const formatPercent = (value) => percentFormatter.format(value);

export const formatSignedPercent = (value) => {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
};

export const formatDateTime = (dateValue) =>
  dateTimeFormatter.format(dateValue);

export const createId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
