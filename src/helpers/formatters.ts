import {
  FormatOptions,
  FormatPreset,
  FormatResult,
  LabelFormatPreset,
} from "../common";

function formatBytes(
  raw: number,
  { binary = false, toDecimalPlaces = 1, locale }: FormatOptions = {}
): FormatResult {
  const base = binary ? 1024 : 1000;
  const units = binary
    ? ["B", "KiB", "MiB", "GiB", "TiB"]
    : ["B", "KB", "MB", "GB", "TB"];

  let scaled = raw;
  let i = 0;
  while (Math.abs(scaled) >= base && i < units.length - 1) {
    scaled /= base;
    i++;
  }

  return {
    value: new Intl.NumberFormat(locale, {
      maximumFractionDigits: toDecimalPlaces,
    }).format(scaled),
    unit: units[i],
  };
}

function formatDuration(seconds: number): FormatResult {
  const units: [string, number][] = [
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
    ["s", 1],
  ];
  let remaining = Math.floor(seconds);
  const parts: string[] = [];

  for (const [label, size] of units) {
    if (remaining >= size) {
      const count = Math.floor(remaining / size);
      parts.push(`${count}${label}`);
      remaining %= size;
    }
  }

  return { value: parts.length ? parts.join(" ") : "0s" };
}

function formatNumber(
  raw: number,
  { locale, toDecimalPlaces }: FormatOptions = {}
): FormatResult {
  return {
    value: new Intl.NumberFormat(locale, {
      maximumFractionDigits: toDecimalPlaces ?? 2,
    }).format(raw),
  };
}

// length / volume / dataRate can all reuse the same scaling shape as formatBytes,
// just with a different `units` array and `base` — e.g.:
function formatLength(
  raw: number,
  { toDecimalPlaces = 1, locale }: FormatOptions = {}
): FormatResult {
  const units: [string, number][] = [
    ["km", 1000],
    ["m", 1],
    ["cm", 0.01],
    ["mm", 0.001],
  ];
  const [unit, factor] =
    units.find(([, f]) => Math.abs(raw) >= f) ?? units[units.length - 1];
  return {
    value: new Intl.NumberFormat(locale, {
      maximumFractionDigits: toDecimalPlaces,
    }).format(raw / factor),
    unit,
  };
}

export const FORMATTERS: Record<
  FormatPreset,
  (raw: number, opts?: FormatOptions) => FormatResult
> = {
  /** Locale-aware thousands separators, e.g. 123456 -> "123,456". */
  number: formatNumber,
  /** Auto-scales bytes to the largest sensible unit: B / KB / MB / GB / TB (or KiB/MiB/GiB with `binary: true`). */
  bytes: formatBytes,
  /** Converts seconds into a compact duration string, e.g. 9000 -> "2h 30m". */
  duration: formatDuration,
  /** Auto-scales meters to the largest sensible unit: mm / cm / m / km. */
  length: formatLength,
  /** Auto-scales milliliters to the largest sensible unit: mL / L. */
  volume: (raw, opts) => formatLength(raw, opts),
  /** Auto-scales bits-per-second to the largest sensible unit: bps / Kbps / Mbps. */
  dataRate: (raw, opts) => formatBytes(raw, opts),
  /** Formats a 0–100 number as a percentage string, e.g. 45 -> "45%". */
  percent: (raw, { toDecimalPlaces, locale } = {}) => ({
    value: new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: toDecimalPlaces ?? 1,
    }).format(raw / 100),
  }),
};

/**
 * Formats a timestamp as a human-relative string (e.g. "5 minutes ago",
 * "2 hours ago", "just now") instead of a fixed clock time.
 *
 * Accepts timestamps in either seconds or milliseconds — values below
 * 1e12 are assumed to be seconds and converted automatically.
 */
export function relativeTime(timestamp: number, locale?: string): string {
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const diffSeconds = Math.round((ms - Date.now()) / 1000);

  const divisions: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unit, secondsInUnit] of divisions) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === "second") {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }

  return rtf.format(0, "second");
}

export const LABEL_FORMATTERS: Record<
  LabelFormatPreset,
  (ts: number, options?: { locale?: string; timezone?: string }) => string
> = {
  time: (ts, options) => {
    const d = ts < 1e12 ? new Date(ts * 1000) : new Date(ts);
    const timeZone =
      options?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `Updated ${d.toLocaleTimeString(options?.locale, { timeZone })}`;
  },
  date: (ts, options) => {
    const d = ts < 1e12 ? new Date(ts * 1000) : new Date(ts);
    const timeZone =
      options?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `Updated ${d.toLocaleDateString(options?.locale, { timeZone })}`;
  },
  datetime: (ts, options) => {
    const d = ts < 1e12 ? new Date(ts * 1000) : new Date(ts);
    const timeZone =
      options?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `Updated ${d.toLocaleString(options?.locale, { timeZone })}`;
  },
  relative: (ts, options) => relativeTime(ts, options?.locale),
  iso: (ts) => {
    const d = ts < 1e12 ? new Date(ts * 1000) : new Date(ts);
    return d.toISOString(); // always UTC by definition — timezone option has no effect here
  },
};
