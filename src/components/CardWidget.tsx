import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { AnedyaWidgetBaseProps } from "../common";
import { SlotClassNames, WidgetTheme } from "../types/root";

import { CARD_DEFAULT_CLASSES, darkTheme, lightTheme } from "../themes/defaultTheme";

export type CardSlot = "container" | "title" | "value" | "unit" | "label";

export interface CardWidgetProps extends AnedyaWidgetBaseProps {
  unit?: string;
  /** Decimal places for the displayed value. Omit to show the raw value as-is. */
  precision?: number;
  formatValue?: (value: number) => string;
  /** Text shown under the value, e.g. a last-updated label — pass a function to compute it from the latest timestamp. */
  labelText?: (timestamp: number) => string;

  /**
   * Per-slot CSS class overrides — Tailwind, a shadcn-generated class,
   * CSS Modules, plain hand-written CSS, anything. When a slot ends up
   * with a class from here AND/OR a matched `styleRules`/
   * `onStyleChange` result, this widget's own inline theme styling for
   * that slot is skipped entirely, so your class(es) have full,
   * uncontested control.
   */
  classNames?: SlotClassNames<CardSlot>;

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
  theme,
  classNames = {},
  className,
  style,
  width,
  height,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
}: CardWidgetProps) {
  const [value, setValue] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  

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

const resolvedTheme: WidgetTheme<CardSlot> =
  theme === "dark"
    ? darkTheme
    : theme === "light"
      ? lightTheme
      : theme ?? lightTheme;

  // Per-slot resolution:
  //   - className: static `classNames` prop + rule-driven classes,
  //     combined via clsx then twMerge — resolves real Tailwind
  //     conflicts between the two sources (e.g. a static text color
  //     class and a rule-matched one) rather than leaving both in the
  //     DOM with an unpredictable winner based on stylesheet order.
  //   - style: the theme's default inline style for that slot —
  //     skipped ENTIRELY if any class exists for that slot (from either
  //     source), so the class has full control. An inline style would
  //     otherwise silently win over a class regardless of source, since
  //     that's just how CSS specificity works.
const resolveSlot = (slot: CardSlot) =>
  twMerge(
    CARD_DEFAULT_CLASSES[slot],
    resolvedTheme.classNames[slot],
    classNames[slot]
  );

  const displayValue = useMemo(() => {
    if (value == null) return null;
    if (formatValue) return formatValue(value);
    if (precision != null) return value.toFixed(precision);
    return String(value);
  }, [value, precision, formatValue]);

  const displayLabel = useMemo(() => {
    if (timestamp == null) return null;
    if (labelText) return labelText(timestamp);
    const d = timestamp < 1e12 ? new Date(timestamp * 1000) : new Date(timestamp);
    return `Updated ${d.toLocaleTimeString()}`;
  }, [timestamp, labelText]);

  return (
    <div
    className={twMerge(
    resolveSlot("container"),
    className
)}
     style={{
    width: width ?? DEFAULT_WIDTH,
    minWidth,
    maxWidth,
    height,
    boxSizing: "border-box",
    ...style,
}}
    >
      <span className={
        resolveSlot("title")}>
        {title}
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
          <span    className={resolveSlot("value")}>
            {displayValue}
            {unit && (
              <span
              className={resolveSlot("unit")}
      
              >
                {unit}
              </span>
            )}
          </span>
          {displayLabel && (
            <span   className={resolveSlot("label")}>
              {displayLabel}
            </span>
          )}
        </>
      )}
    </div>
  );
}