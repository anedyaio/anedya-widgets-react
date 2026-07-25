import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  AnedyaWidgetBaseProps,

} from "../common";

import type { FormatOptions, FormatPreset, LabelFormatPreset } from "../common";
import { SlotClassNames, WidgetTheme } from "../types/root";

import {
  CARD_DEFAULT_CLASSES,
  darkTheme,
  lightTheme,
} from "../themes/defaultTheme";
import { FORMATTERS, LABEL_FORMATTERS } from "../helpers/formatters";

export type CardSlot = "container" | "title" | "value" | "unit" | "label"|"error" | "empty";




/** The raw data this widget fetched — exactly what comes back from the request, not yet formatted. */
export interface CardData {
  value: number;
  timestamp: number;
}
/** Describes which state the widget just landed in, passed alongside `data` to `onDataChange`. */
export interface CardDataMeta {
  kind: "success" | "error" | "empty";
  /** Present only when kind === "error". */
  error?: string;
}
export type CardWidgetUpdate = Partial<
  Omit<CardWidgetProps, "node" | "variable" | "onDataChange">
>;
export interface CardWidgetProps extends AnedyaWidgetBaseProps {
  unit?: string;
  /** Decimal places for the displayed value. Omit to show the raw value as-is. */
  decimalPlaces?: number;
  /**
   * Full custom formatting function — receives the raw fetched value,
   * returns the exact string to display.
   *
   * Takes precedence over both `format` and `decimalPlaces`.
   */
  formatValue?: (value: number) => string;
  /** Text shown under the value, e.g. a last-updated label — pass a function to compute it from the latest timestamp. */
  labelText?: (timestamp: number) => string;

  /**
   * Per-slot CSS class overrides — Tailwind, a shadcn-generated class,
   * CSS Modules, plain hand-written CSS, or any other CSS classes.
   *
   * Layers on top of the widget's active theme and built-in defaults.
   * Tailwind conflicts are resolved via `twMerge`, so later overrides
   * replace earlier utilities within the same Tailwind class group.
   */
  styles?: SlotClassNames<CardSlot>;
  /**
   * Called whenever the latest fetched data changes.
   *
   * Return a partial set of this widget's optional props to
   * temporarily override how it is rendered.
   *
   * Any returned props are applied until this callback is
   * called again.
   *
   * Returning `undefined` (or nothing) clears any previous
   * overrides and restores the widget's original props.
   *
   * Example:
   *
   * onDataChange={(data) => {
   *   if (!data) return;
   *
   *   if (data.value > 80) {
   *     return {
   *       title: "High Humidity",
   *       theme: "dark",
   *       styles: {
   *         value: "text-red-500",
   *       },
   *     };
   *   }
   * }}
   */
onDataChange?: (data: CardData | null, meta: CardDataMeta) => CardWidgetUpdate | void;

  /**
   * Named formatting preset for common unit types — auto-scales both
   * the displayed number and its unit (e.g. `"bytes"` turns `500000`
   * into `"500"` + `"KB"`).
   *
   * When set, this overrides the `unit` prop — the preset determines
   * its own unit per value.
   *
   * Ignored if `formatValue` is also provided.
   */
  format?: FormatPreset;
  /** Options for the active `format` preset — e.g. `{ formatOptions: 2, locale: "en-IN" }`. */
  formatOptions?: FormatOptions;
  /**
   * Named preset for the last-updated label's format. Ignored if
   * `labelText` is also provided (which always takes precedence).
   * Defaults to `"time"`, matching the widget's previous fixed behavior.
   */
  labelFormat?: LabelFormatPreset;
  /** Custom render for the error state. Return JSX to fully replace the default error text. */
renderError?: (error: string) => React.ReactNode;

/** Custom render when the fetch succeeds but no data is available. Defaults to a greyed-out "N/A". */
renderEmpty?: () => React.ReactNode;
/**
 * IANA timezone name (e.g. "Asia/Kolkata", "America/New_York") used when
 * formatting the last-updated label. Defaults to the browser's
 * auto-detected timezone if omitted.
 */
timezone?: string;
}

const DEFAULT_WIDTH = 240;
const DEFAULT_HEIGHT = 160;
const DEFAULT_MIN_WIDTH = 180;
const DEFAULT_MAX_WIDTH = 480;

export function CardWidget({
  node,
  variable,
  title = "Latest Value",
  unit,
  decimalPlaces,
  formatValue,
  labelText,
  styles = {},
  onDataChange,
  theme,
  className,

  width,
  height,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
  format,
  formatOptions,
  labelFormat,
   timezone,
  renderError,
  renderEmpty,
}: CardWidgetProps): React.JSX.Element {
  const [value, setValue] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  // Holds the temporary prop overrides returned by onDataChange.
  // Whenever the callback returns nothing (or the condition no longer
  // matches), this resets back to {} so the widget falls back to the
  // original props it was created with.
  const [dynamicProps, setDynamicProps] = useState<CardWidgetUpdate>({});

  const mountedRef = useRef(false);
  const isFetchingRef = useRef(false);

  
  useEffect(() => {
    if (!node) return;
    mountedRef.current = true;

    const fetchLatest = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await node.getLatestData(variable);
        if (!mountedRef.current) return;

        if (res.isSuccess && res.isDataAvailable) {
          setValue(res.data.value);
          setTimestamp(res.data.timestamp);
          setError(null);
          setIsEmpty(false);
        }  else if (res.isSuccess && !res.isDataAvailable) {
          // Fetch succeeded, but there's genuinely no data yet — distinct
          // from an actual error.
          setValue(null);
          setTimestamp(null);
          setError(null);
          setIsEmpty(true);
        }
       else {
          setValue(null);
          setError(res.error?.errorMessage ?? "Failed to fetch data");
          setIsEmpty(false);
        }
      } catch (err: any) {
        if (!mountedRef.current) return;
       setValue(null);
        setError(err?.message ?? "Failed to fetch data");
        setIsEmpty(false);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchLatest();
    return () => {
      mountedRef.current = false;
    };
  }, [node, variable]);

   // Resolve onDataChange whenever data / error / empty status changes.
  // The callback returns temporary prop overrides which layer on top
  // of the widget's original props.
  useEffect(() => {
    if (!onDataChange) {
      setDynamicProps({});
      return;
    }

    const data =
      value != null && timestamp != null ? { value, timestamp } : null;
 const meta: CardDataMeta = error
      ? { kind: "error", error }
      : isEmpty
        ? { kind: "empty" }
        : { kind: "success" };
    setDynamicProps(onDataChange(data, meta) ?? {});
  }, [value, timestamp, error, isEmpty, onDataChange]);
  const resolvedProps = {
    title,
    unit,
    decimalPlaces,
    formatValue,
    labelText,
    width: width ?? DEFAULT_WIDTH,
    // height: height ?? DEFAULT_HEIGHT,
    height,
    minWidth,
    maxWidth,
    className,
    theme,
    format,
    formatOptions,
    labelFormat,
     timezone,
    renderError,
    renderEmpty,
    ...dynamicProps,

    styles: {
      ...(styles ?? {}),
      ...(dynamicProps.styles ?? {}),
    },
  };

  const resolvedTheme: WidgetTheme<CardSlot> =
    resolvedProps.theme === "dark"
      ? darkTheme
      : resolvedProps.theme === "light"
        ? lightTheme
        : (resolvedProps.theme ?? lightTheme);

  // Per-slot resolution, lowest to highest precedence:
  //   1. CARD_DEFAULT_CLASSES[slot]      — built-in baseline
  //   2. resolvedTheme.styles[slot]  — active theme's classes
  // 3. resolvedProps.styles
  //    (original styles merged with any returned by onDataChange)

  // twMerge resolves any real Tailwind conflicts between these layers
  // based on actual utility groups, not the order they're written in.
  const resolveSlot = (slot: CardSlot) =>
    twMerge(
      CARD_DEFAULT_CLASSES[slot],
      resolvedTheme.styles[slot],
      resolvedProps.styles[slot],
    );

  const { displayValue, displayUnit } = useMemo(() => {
    if (value == null) return { displayValue: null, displayUnit: resolvedProps.unit };

    if (resolvedProps.formatValue) {
      return { displayValue: resolvedProps.formatValue(value), displayUnit: resolvedProps.unit };
    }

    if (resolvedProps.format) {
      const result = FORMATTERS[resolvedProps.format](value, resolvedProps.formatOptions);
      return { displayValue: result.value, displayUnit: result.unit };
    }

    if (resolvedProps.decimalPlaces != null) {
      return { displayValue: value.toFixed(resolvedProps.decimalPlaces), displayUnit: resolvedProps.unit };
    }

    return { displayValue: String(value), displayUnit: resolvedProps.unit };
  }, [value, resolvedProps.formatValue, resolvedProps.format, resolvedProps.formatOptions, resolvedProps.decimalPlaces, resolvedProps.unit]);

 
 // Auto-detect the browser's timezone unless the consumer overrides it.
  const resolvedTimezone =
    resolvedProps.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
 const displayLabel = useMemo(() => {
    if (timestamp == null) return null;

    if (resolvedProps.labelText) return resolvedProps.labelText(timestamp);

    const formatter = LABEL_FORMATTERS[resolvedProps.labelFormat ?? "time"];
    return formatter(timestamp, {
      locale: resolvedProps.formatOptions?.locale,
      timezone: resolvedTimezone,
    });
  }, [timestamp, resolvedProps.labelText, resolvedProps.labelFormat, resolvedProps.formatOptions?.locale, resolvedTimezone]);
  const hasExplicitHeight = height != null || dynamicProps.height != null;

  return (
    <div
      className="anedya-card-container"
      style={{
        width: resolvedProps.width,
        minWidth: resolvedProps.minWidth,
        maxWidth: resolvedProps.maxWidth,
        ...(hasExplicitHeight
          ? { height: resolvedProps.height } // definite → drives cqh, hard-capped
          : { minHeight: DEFAULT_HEIGHT }), // no height passed → auto-grow, cqw-only
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className={twMerge(
          "anedya-card",
          resolveSlot("container"),
          resolvedProps.className,
        )}
        style={{
          flex: "1 0 auto",
          ...(hasExplicitHeight ? { overflow: "hidden" } : {}),
        }}
      >
        <span className={resolveSlot("title")}>{resolvedProps.title}</span>

        {loading ? (
          <div className="flex flex-col gap-[var(--anedya-card-gap)] w-full items-center justify-center">
            {/* Value Skeleton: Uses the exact font-size variable as its height */}
            <div
              className="w-2/3 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"
              style={{
                height: "var(--anedya-card-value-size)",
                backgroundColor: theme === "dark" ? "#374151" : "#e5e7eb",
              }}
            />

            {/* Label Skeleton: Uses the exact label-size variable as its height */}
            <div
              className="w-1/2 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"
              style={{
                height: "var(--anedya-card-label-size)",
                backgroundColor: theme === "dark" ? "#374151" : "#e5e7eb",
              }}
            />
          </div>
        ) : error ? (
          resolvedProps.renderError ? (
            resolvedProps.renderError(error)
          ) : (
            <span className={resolveSlot("error")}>{error}</span>
          )
        ) :isEmpty ? (
          resolvedProps.renderEmpty ? (
            resolvedProps.renderEmpty()
          ) : (
            <span className={resolveSlot("empty")}>N/A</span>
          )
        ) : (
          <>
            <span
              className={twMerge(
                "inline-flex items-baseline justify-center gap-1",
                resolveSlot("value"),
              )}
            >
              <span className="min-w-0 break-words">{displayValue}</span>

              {displayUnit && (
                <span className={resolveSlot("unit")}>{displayUnit}</span>
              )}
            </span>
            {displayLabel && (
              <span className={resolveSlot("label")}>{displayLabel}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
