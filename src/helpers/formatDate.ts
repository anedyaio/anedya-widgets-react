export function formatDate(date: Date, format: string): string {
  return format
    .replace("YYYY", String(date.getFullYear()))
    .replace("MM", String(date.getMonth() + 1).padStart(2, "0"))
    .replace("DD", String(date.getDate()).padStart(2, "0"))
    .replace("HH", String(date.getHours()).padStart(2, "0"))
    .replace("hh", String((date.getHours() % 12) || 12).padStart(2, "0"))
    .replace("mm", String(date.getMinutes()).padStart(2, "0"))
    .replace("ss", String(date.getSeconds()).padStart(2, "0"));
}

export function formatNumber(value: number, format: string): string {
  // Examples:
  // "0.00" = 2 decimals
  if (/0\.0+/.test(format)) {
    const decimals = format.split(".")[1].length;
    return value.toFixed(decimals);
  }

  // "value unit"
  if (format.includes("value") && format.includes("unit")) {
    return format
      .replace("value", String(value))
      .replace("unit", "");
  }

  return String(value); // fallback
}


export function defaultDateFormatter(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
