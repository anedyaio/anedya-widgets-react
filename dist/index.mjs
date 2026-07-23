// src/components/CardWidget.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

// src/themes/defaultTheme.ts
var CARD_DEFAULT_CLASSES = {
  title: "text-[length:var(--anedya-card-title-size)] font-medium",
  value: "text-[length:var(--anedya-card-value-size)] font-bold",
  unit: "text-[length:var(--anedya-card-unit-size)]",
  label: "text-[length:var(--anedya-card-label-size)]",
  container: "flex flex-col items-center justify-center text-center border rounded-xl p-[var(--anedya-card-padding)] gap-[var(--anedya-card-gap)]"
};
var lightTheme = {
  classNames: {
    container: "bg-white border-slate-200",
    title: "text-slate-500",
    value: "text-slate-900",
    label: "text-slate-400"
  }
};
var darkTheme = {
  classNames: {
    container: "bg-slate-900 border-slate-800",
    title: "text-slate-400",
    value: "text-white",
    label: "text-slate-500"
  }
};

// src/components/CardWidget.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var DEFAULT_WIDTH = 240;
var DEFAULT_MIN_WIDTH = 180;
var DEFAULT_MAX_WIDTH = 480;
function CardWidget({
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
  maxWidth = DEFAULT_MAX_WIDTH
}) {
  const [value, setValue] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dynamicProps, setDynamicProps] = useState({});
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
      } catch (err) {
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
  useEffect(() => {
    if (!onDataChange) {
      setDynamicProps({});
      return;
    }
    const data = value != null && timestamp != null ? { value, timestamp } : null;
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
      ...classNames ?? {},
      ...dynamicProps.classNames ?? {}
    }
  };
  const resolvedTheme = resolvedProps.theme === "dark" ? darkTheme : resolvedProps.theme === "light" ? lightTheme : resolvedProps.theme ?? lightTheme;
  const resolveSlot = (slot) => twMerge(
    CARD_DEFAULT_CLASSES[slot],
    resolvedTheme.classNames[slot],
    resolvedProps.classNames[slot]
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
    const d = timestamp < 1e12 ? new Date(timestamp * 1e3) : new Date(timestamp);
    return `Updated ${d.toLocaleTimeString()}`;
  }, [timestamp, resolvedProps.labelText]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "anedya-card-container",
      style: {
        width: resolvedProps.width,
        minWidth: resolvedProps.minWidth,
        maxWidth: resolvedProps.maxWidth,
        height: resolvedProps.height,
        boxSizing: "border-box"
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: twMerge(
            "anedya-card",
            resolveSlot("container"),
            resolvedProps.className
          ),
          style: { height: "100%" },
          children: [
            /* @__PURE__ */ jsx("span", { className: resolveSlot("title"), children: resolvedProps.title }),
            loading ? /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  height: 36,
                  width: 36,
                  borderRadius: "50%",
                  border: "2px solid #cbd5e1",
                  borderTopColor: "#475569",
                  animation: "anedya-card-spin 0.8s linear infinite"
                },
                children: /* @__PURE__ */ jsx("style", { children: `@keyframes anedya-card-spin { to { transform: rotate(360deg); } }` })
              }
            ) : error ? /* @__PURE__ */ jsx("span", { className: "text-red-600 text-sm", children: error }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(
                "span",
                {
                  className: twMerge(
                    "inline-flex items-end justify-center gap-1",
                    resolveSlot("value")
                  ),
                  children: [
                    /* @__PURE__ */ jsx("span", { children: displayValue }),
                    resolvedProps.unit && /* @__PURE__ */ jsx("span", { className: resolveSlot("unit"), children: resolvedProps.unit })
                  ]
                }
              ),
              displayLabel && /* @__PURE__ */ jsx(
                "span",
                {
                  className: resolveSlot("label"),
                  children: displayLabel
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
export {
  CardWidget
};
