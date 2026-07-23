import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { AnedyaWidgetBaseProps } from "../common";
import { SlotClassNames, WidgetTheme } from "../types/root";

import {
  CARD_DEFAULT_CLASSES,
  darkTheme,
  lightTheme,
} from "../themes/defaultTheme";

export type CardSlot = "container" | "title" | "value" | "unit" | "label";

/** The raw data this widget fetched — exactly what comes back from the request, not yet formatted. */
export interface CardData {
  value: number;
  timestamp: number;
}
export type CardWidgetUpdate = Partial<
  Omit<
    CardWidgetProps,
    "node"  | "variable" | "onDataChange"
  >
>;
export interface CardWidgetProps extends AnedyaWidgetBaseProps {
  unit?: string;
  /** Decimal places for the displayed value. Omit to show the raw value as-is. */
  precision?: number;
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
  classNames?: SlotClassNames<CardSlot>;
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
   *       classNames: {
   *         value: "text-red-500",
   *       },
   *     };
   *   }
   * }}
   */
  onDataChange?: (data: CardData | null) => CardWidgetUpdate | void;
}

const DEFAULT_WIDTH = 240;
const DEFAULT_MIN_WIDTH = 180;
const DEFAULT_MAX_WIDTH = 480;

export function CardWidget({
  node,
  variable,
  title = "Latest Value",
  unit,
  precision,
  formatValue,
  labelText,
  classNames = {},
  onDataChange,
  theme,
  className,

  width,
  height,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
}: CardWidgetProps) {
  const [value, setValue] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        } else {
          setValue(null);
          setError(res.error?.errorMessage ?? "No data available");
        }
      } catch (err: any) {
        if (!mountedRef.current) return;
        setValue(null);
        setError(err?.message ?? "Failed to fetch data");
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

  // Resolve onDataChange whenever the fetched data changes.
  // The callback returns temporary prop overrides which layer on top
  // of the widget's original props.
  useEffect(() => {
    if (!onDataChange) {
      setDynamicProps({});
      return;
    }

    const data =
      value != null && timestamp != null ? { value, timestamp } : null;

    setDynamicProps(onDataChange(data) ?? {});
  }, [value, timestamp, onDataChange]);
  const resolvedProps = {
    title,
    unit,
    precision,
    formatValue,
    labelText,
    width: width ?? DEFAULT_WIDTH,
    height,
    minWidth,
    maxWidth,
    className,
    theme,
    ...dynamicProps,

    classNames: {
      ...(classNames ?? {}),
      ...(dynamicProps.classNames ?? {}),
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
  //   2. resolvedTheme.classNames[slot]  — active theme's classes
  // 3. resolvedProps.classNames
  //    (original classNames merged with any returned by onDataChange)

  // twMerge resolves any real Tailwind conflicts between these layers
  // based on actual utility groups, not the order they're written in.
  const resolveSlot = (slot: CardSlot) =>
    twMerge(
      CARD_DEFAULT_CLASSES[slot],
      resolvedTheme.classNames[slot],
      resolvedProps.classNames[slot],
    );

  const displayValue = useMemo(() => {
    if (value == null) return null;

    if (resolvedProps.formatValue) return resolvedProps.formatValue(value);

    if (resolvedProps.precision != null)
      return value.toFixed(resolvedProps.precision);

    return String(value);
  }, [value, resolvedProps.formatValue, resolvedProps.precision]);
  const displayLabel = useMemo(() => {
    if (timestamp == null) return null;

    if (resolvedProps.labelText) return resolvedProps.labelText(timestamp);

    const d =
      timestamp < 1e12 ? new Date(timestamp * 1000) : new Date(timestamp);

    return `Updated ${d.toLocaleTimeString()}`;
  }, [timestamp, resolvedProps.labelText]);
  return (
    <div
  className="anedya-card-container"
  style={{
    width: resolvedProps.width,
    minWidth: resolvedProps.minWidth,
    maxWidth: resolvedProps.maxWidth,
    height: resolvedProps.height,
    boxSizing: "border-box",
  }}
  >
    <div
     className={twMerge(
    "anedya-card",
    resolveSlot("container"),
    resolvedProps.className,
)}
 style={{ height: "100%" }}
 
    >
      <span className={ resolveSlot("title")}>
        {resolvedProps.title}
      </span>

      {loading ? (
        <div
          style={{
            height: 36,
            width: 36,
            borderRadius: "50%",
            border: "2px solid #cbd5e1",
            borderTopColor: "#475569",
            animation: "anedya-card-spin 0.8s linear infinite",
          }}
        >
          <style>{`@keyframes anedya-card-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <span className="text-red-600 text-sm">{error}</span>
      ) : (
        <>
          {/* <span className={resolveSlot("value")}>
            {displayValue}
            {resolvedProps.unit && (
              <span
                className={resolveSlot("unit")}
              >
                {resolvedProps.unit}
              </span>
            )}
          </span> */}
          <span
  className={twMerge(
    "inline-flex items-end justify-center gap-1",
    resolveSlot("value")
  )}
>
  <span>{displayValue}</span>

  {resolvedProps.unit && (
    <span className={resolveSlot("unit")}>
      {resolvedProps.unit}
    </span>
  )}
</span>
          {displayLabel && (
            <span
              className={resolveSlot("label")}
            >
              {displayLabel}
            </span>
          )}
        </>
      )}
    </div>
</div>
  );
}
