import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/themes/defaultTheme.ts
const CARD_DEFAULT_CLASSES = {
	title: "text-[length:var(--anedya-card-title-size)] font-medium",
	value: "text-[length:var(--anedya-card-value-size)] font-bold max-w-full min-w-0 leading-tight",
	unit: "text-[length:var(--anedya-card-unit-size)]",
	label: "text-[length:var(--anedya-card-label-size)]",
	container: "flex flex-col items-center justify-center text-center border rounded-xl p-[var(--anedya-card-padding)] gap-[var(--anedya-card-gap)]"
};
const lightTheme = { styles: {
	container: "bg-white border-slate-200",
	title: "text-slate-500",
	value: "text-slate-900",
	label: "text-slate-400"
} };
const darkTheme = { styles: {
	container: "bg-slate-900 border-slate-800",
	title: "text-slate-400",
	value: "text-white",
	label: "text-slate-500"
} };
//#endregion
//#region src/components/CardWidget.tsx
const DEFAULT_WIDTH = 240;
const DEFAULT_HEIGHT = 160;
const DEFAULT_MIN_WIDTH = 180;
const DEFAULT_MAX_WIDTH = 480;
function CardWidget({ node, variable, title = "Latest Value", unit, decimalPlaces, formatValue, labelText, styles = {}, onDataChange, theme, className, width, height, minWidth = DEFAULT_MIN_WIDTH, maxWidth = DEFAULT_MAX_WIDTH }) {
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
		setDynamicProps(onDataChange(value != null && timestamp != null ? {
			value,
			timestamp
		} : null) ?? {});
	}, [
		value,
		timestamp,
		onDataChange
	]);
	const resolvedProps = {
		title,
		unit,
		decimalPlaces,
		formatValue,
		labelText,
		width: width ?? DEFAULT_WIDTH,
		height,
		minWidth,
		maxWidth,
		className,
		theme,
		...dynamicProps,
		styles: {
			...styles ?? {},
			...dynamicProps.styles ?? {}
		}
	};
	const resolvedTheme = resolvedProps.theme === "dark" ? darkTheme : resolvedProps.theme === "light" ? lightTheme : resolvedProps.theme ?? lightTheme;
	const resolveSlot = (slot) => twMerge(CARD_DEFAULT_CLASSES[slot], resolvedTheme.styles[slot], resolvedProps.styles[slot]);
	const displayValue = useMemo(() => {
		if (value == null) return null;
		if (resolvedProps.formatValue) return resolvedProps.formatValue(value);
		if (resolvedProps.decimalPlaces != null) return value.toFixed(resolvedProps.decimalPlaces);
		return String(value);
	}, [
		value,
		resolvedProps.formatValue,
		resolvedProps.decimalPlaces
	]);
	const displayLabel = useMemo(() => {
		if (timestamp == null) return null;
		if (resolvedProps.labelText) return resolvedProps.labelText(timestamp);
		return `Updated ${(timestamp < 0xe8d4a51000 ? /* @__PURE__ */ new Date(timestamp * 1e3) : new Date(timestamp)).toLocaleTimeString()}`;
	}, [timestamp, resolvedProps.labelText]);
	const hasExplicitHeight = height != null || dynamicProps.height != null;
	return /* @__PURE__ */ jsx("div", {
		className: "anedya-card-container",
		style: {
			width: resolvedProps.width,
			minWidth: resolvedProps.minWidth,
			maxWidth: resolvedProps.maxWidth,
			...hasExplicitHeight ? { height: resolvedProps.height } : { minHeight: DEFAULT_HEIGHT },
			boxSizing: "border-box",
			display: "flex",
			flexDirection: "column"
		},
		children: /* @__PURE__ */ jsxs("div", {
			className: twMerge("anedya-card", resolveSlot("container"), resolvedProps.className),
			style: {
				flex: "1 0 auto",
				...hasExplicitHeight ? { overflow: "hidden" } : {}
			},
			children: [/* @__PURE__ */ jsx("span", {
				className: resolveSlot("title"),
				children: resolvedProps.title
			}), loading ? /* @__PURE__ */ jsxs("div", {
				className: "flex flex-col gap-[var(--anedya-card-gap)] w-full items-center justify-center",
				children: [/* @__PURE__ */ jsx("div", {
					className: "w-2/3 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse",
					style: {
						height: "var(--anedya-card-value-size)",
						backgroundColor: theme === "dark" ? "#374151" : "#e5e7eb"
					}
				}), /* @__PURE__ */ jsx("div", {
					className: "w-1/2 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse",
					style: {
						height: "var(--anedya-card-label-size)",
						backgroundColor: theme === "dark" ? "#374151" : "#e5e7eb"
					}
				})]
			}) : error ? /* @__PURE__ */ jsx("span", {
				className: "text-red-600 text-sm",
				children: error
			}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("span", {
				className: twMerge("inline-flex items-baseline justify-center gap-1", resolveSlot("value")),
				children: [/* @__PURE__ */ jsx("span", {
					className: "min-w-0 break-words",
					children: displayValue
				}), resolvedProps.unit && /* @__PURE__ */ jsx("span", {
					className: resolveSlot("unit"),
					children: resolvedProps.unit
				})]
			}), displayLabel && /* @__PURE__ */ jsx("span", {
				className: resolveSlot("label"),
				children: displayLabel
			})] })]
		})
	});
}
//#endregion
export { CardWidget };
