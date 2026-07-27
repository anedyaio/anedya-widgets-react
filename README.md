[<img alt="PyPI" src="https://img.shields.io/npm/v/%40anedyasystems%2Fanedya-frontend-sdk?style=for-the-badge">](https://www.npmjs.com/package/@anedyasystems/anedya-frontend-sdk)&nbsp;&nbsp;[<img alt="Anedya Documentation" src="https://img.shields.io/badge/Anedya-Documentation-blue?style=for-the-badge">](https://docs.anedya.io?utm_source=github&utm_medium=link&utm_campaign=github-sdk&utm_content=js)

<!---<div style="width:20%; margin:0 auto;margin-bottom:50px;margin-top:50px;">-->
<p align="center">
    <img src="https://cdn.anedya.io/anedya_black_banner.png" alt="Logo">
</p>
<!--</div>-->

# Anedya Widgets SDK

A collection of pre-built, themeable React widgets for displaying Anedya IoT data — drop-in components for dashboards and front-end apps.

## Table of Contents

- [Widgets](#widgets)
  - [CardWidget](#cardwidget)
    - [Required props](#required-props)
    - [The styling model](#the-styling-model)
    - [`styles` vs `className`](#styles-vs-classname--the-distinction-that-matters-most)
    - [Theming](#theming)
    - [Tailwind responsive utilities](#tailwind-responsive-utilities)
    - [`onDataChange` — data-driven rendering](#ondatachange--data-driven-rendering)
    - [How props are resolved](#how-props-are-resolved)
  - [Formatting vs rendering](#formatting-vs-rendering)
  - [GaugeWidget](#gaugewidget)                              
    - [Required props](#required-props-1)
    - [The styling model](#the-styling-model-1)
    - [Theming](#theming-1)
    - [Manual value mode](#manual-value-mode--using-gauge-without-a-node)
    - [Arc, track, bar & needle](#arc-track-bar--needle)
    - [Tick marks](#tick-marks)
    - [Animation](#animation)
    - [Sizing](#sizing-1)
- [The last-updated label](#the-last-updated-label)
- [Error & empty states](#error--empty-states)
- [Formatters export](#formatters-export)

---

## Installation & Setup

Widgets in this SDK don't create their own Anedya client or node — they only render data you fetch through the [Anedya Frontend SDK](https://www.npmjs.com/package/@anedyasystems/anedya-frontend-sdk), which is a separate package you'll need alongside this one.

**1. Install both packages:**

```bash
npm install @anedyasystems/anedya-frontend-sdk public-widget-sdk
```

**2. Import the stylesheet once**, anywhere in your app's entry point:

```jsx
import "public-widget-sdk/styles.css";
```

**3. Create a client and node using the Frontend SDK, then pass the node into any widget:**

```jsx
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "public-widget-sdk";
import "public-widget-sdk/styles.css";

const anedya = new Anedya();
const config = anedya.newConfig(tokenId, token);
const client = anedya.newClient(config);
const node = anedya.newNode(client, nodeId);

<CardWidget node={node} variable="humidity" />;
```

> `tokenId`, `token`, and `nodeId` come from your Anedya account/device setup — see the [Frontend SDK docs](https://www.npmjs.com/package/@anedyasystems/anedya-frontend-sdk) for details on obtaining these and on other `node`/`client` methods (fetching historical data, live streaming, key-value store, etc.) beyond what these widgets use directly.

---

## Widgets

### CardWidget

A single-value display widget — shows the latest reading, a title, and a last-updated label.

```jsx
<CardWidget
  node={node}
  variable="humidity"
  title="Humidity"
  unit="%"
  decimalPlaces={1}
/>
```

#### Required props

| Prop       | Type     | Description                      |
| ---------- | -------- | -------------------------------- |
| `node`     | `any`    | `anedya.newNode(client, nodeId)` |
| `variable` | `string` | Variable name to display         |

---

#### The styling model

`CardWidget` is **entirely class-based** — every visual choice is a CSS class string, not a style property. This is deliberate: card widgets are commonly styled with Tailwind, and classes compose and override far more predictably than inline styles do once you're combining a theme, a per-instance override, and a conditional rule all on the same element.

Every part of the card is a named **slot**:

```ts
type CardSlot = "container" | "title" | "value" | "unit" | "label";
```

---

#### `styles` vs `className` — the distinction that matters most

These look similar but do genuinely different things:

|             | Shape                 | Targets                                                              | Purpose                                                |
| ----------- | --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| `styles`    | object, keyed by slot | any inner slot (`title`, `value`, `unit`, `label`) _and_ `container` | reach inside the widget                                |
| `className` | plain string          | only the outermost container element                                 | the ordinary React convention every component supports |

```jsx
<CardWidget
  className="shadow-lg" // outer box only
  styles={{
    value: "text-red-500 text-5xl", // the "value" slot specifically
    title: "uppercase tracking-wider", // the "title" slot specifically
  }}
/>
```

Both can be used together freely — `className` is merged (via `twMerge`) with whatever `styles.container` already resolved to; it doesn't replace it.

> **Note:** `styles` classes are consumer-authored strings forwarded straight into `className` at render — the widget doesn't generate any CSS for them at build time. Any class you pass here must already exist in your own app's compiled CSS (e.g. your own Tailwind build, or a plain hand-written class in a stylesheet you import).

---

#### Theming

`theme` accepts a built-in preset name, or a full custom `WidgetTheme<CardSlot>` object — just a plain object shaped like `styles`, reusable across every widget instance that uses it:

```jsx
const emeraldTheme = {
  styles: {
    container: "bg-emerald-50 border-emerald-200",
    title: "text-emerald-700",
    value: "text-emerald-900",
    label: "text-emerald-500",
  },
};

<CardWidget theme={emeraldTheme} />
// or
<CardWidget theme="dark" />   // built-in preset, or "light" (default)
```

---

#### Tailwind responsive utilities

You can freely use Tailwind's responsive prefixes inside `styles`:

```tsx
<CardWidget
  styles={{
    value: "text-2xl md:text-4xl xl:text-6xl",
  }}
/>
```

These breakpoints come entirely from your application's Tailwind configuration and respond to the **browser viewport**. They are independent of the widget's built-in container-query sizing (see [Responsive sizing](#responsive-sizing) below).

If you supply your own `text-*` classes (responsive or otherwise), they replace the widget's default responsive typography for that slot.

---

#### `onDataChange` — data-driven rendering

`onDataChange` is called whenever the latest fetched data changes.

It receives the raw fetched data:

```ts
{
  value: number;
  timestamp: number;
}
```

(or `null` while no data is available).

Instead of returning CSS classes, it returns a **partial set of widget props**. Those returned props temporarily override the widget's original props until the callback runs again.

```tsx
<CardWidget
  onDataChange={(data) => {
    if (!data) return;

    if (data.value > 80) {
      return {
        title: "High Humidity",
        theme: "dark",
        styles: {
          value: "text-red-500",
        },
      };
    }
  }}
/>
```

Returning `undefined` (or nothing) clears any previous overrides and restores the widget's original props.

---

#### How props are resolved

Rendering happens in layers.

1. The props you pass to `<CardWidget />`
2. Any temporary overrides returned from `onDataChange`
3. Theme resolution (`"light"`, `"dark"`, or a custom `WidgetTheme`)
4. Per-slot class resolution

For each slot (`container`, `title`, `value`, `unit`, `label`), classes are merged in this order:

1. `CARD_DEFAULT_CLASSES`
2. Active theme classes
3. `styles`

Later layers win whenever two Tailwind utilities conflict. Conflicts are resolved with `twMerge`.

`className` is separate from this chain — it is merged onto the outer container after the container slot has been resolved.

> **Rule of thumb:** defaults → theme → `styles` → `onDataChange`. User overrides always win.

---

#### Formatting vs rendering

`format`, `formatOptions`, `decimalPlaces`, and `labelFormat` control **what text is displayed**.

`styles` controls **how the widget looks**.

`onDataChange` can override any of these (along with most other widget props), allowing the widget to react to incoming data.

##### `format` — named presets for common unit types

For values that need unit-aware scaling (bytes, durations, lengths, etc.), pass a `format` preset instead of manually computing a unit string:

```tsx
<CardWidget node={node} variable="freeMemory" format="bytes" />
// renders "512" + "MB" — auto-scaled, no manual unit needed

<CardWidget node={node} variable="uptime" format="duration" />
// renders "2d 4h 12m"

<CardWidget node={node} variable="distance" format="length" formatOptions={{ formatOptions: 2 }} />
// renders "1.25" + "km"
```

Available presets:

| Preset     | Input           | Output example                                                                                  |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------- |
| `number`   | any             | `"123,456"` — locale-aware thousands separators                                                 |
| `bytes`    | bytes           | `"500"` + `"KB"` — auto-scales B/KB/MB/GB/TB (or KiB/MiB/GiB with `formatOptions.binary: true`) |
| `duration` | seconds         | `"2h 15m 30s"`                                                                                  |
| `length`   | meters          | `"1.25"` + `"km"` — auto-scales mm/cm/m/km                                                      |
| `volume`   | milliliters     | auto-scales mL/L                                                                                |
| `dataRate` | bits per second | auto-scales bps/Kbps/Mbps                                                                       |
| `percent`  | 0–100           | `"45%"`                                                                                         |

`formatOptions` accepts:

```ts
{
  locale?: string;      // BCP 47 tag, e.g. "en-IN" — defaults to browser locale
  binary?: boolean;     // bytes only: 1024-based (KiB/MiB) vs 1000-based (KB/MB)
  formatOptions?: number;   // decimal places for the scaled number
}
```

**When to use each option:**

- **`locale`** — force a specific number format instead of relying on the visitor's browser/OS locale. Useful for a dashboard serving a specific region, or an app with its own explicit language setting:
```tsx
  <CardWidget format="number" formatOptions={{ locale: "en-IN" }} />
  // "1,23,456" (Indian digit grouping) instead of "123,456"

  <CardWidget format="number" formatOptions={{ locale: "de-DE" }} />
  // "123.456" (German uses "." as the thousands separator, "," as the decimal point)
```

- **`formatOptions`** — control decimal places in the *scaled* output (not the raw value). Useful when the default rounding is too coarse for scientific/financial data, or you want whole numbers for a cleaner dashboard look:
```tsx
  <CardWidget format="bytes" formatOptions={{ formatOptions: 2 }} />
  // "512.34" + "MB" — more decimal places than the default

  <CardWidget format="bytes" formatOptions={{ formatOptions: 0 }} />
  // "512" + "MB" — whole number, no decimals
```

- **`binary`** — *(`bytes` preset only)* choose between 1000-based and 1024-based scaling. These genuinely produce different numbers for the same raw byte count, so picking the wrong one can make a value look incorrect even though the math is technically right for the mode you're in:
```tsx
  <CardWidget format="bytes" formatOptions={{ binary: true }} />
  // raw 1048576 -> "1" + "MiB" — matches how OS file managers/RAM usage are usually reported

  <CardWidget format="bytes" />
  // raw 1048576 -> "1.05" + "MB" — matches how storage manufacturers/network specs are usually reported
```
  As a rule of thumb: use `binary: true` for memory/RAM/file-size-on-disk readings, and the default (decimal) for network throughput or storage capacity marketing figures.
  
**`format` takes over the `unit` slot entirely.** When set, the preset determines its own unit per value (e.g. switching from `"KB"` to `"MB"` as a byte count grows) — the `unit` prop is ignored while `format` is active.

> **Presets don't validate that they match your data's actual meaning** — they only know how to scale a raw number. Applying `format="length"` to a Celsius reading, for example, will scale it as if it were meters and display a plausible-looking but semantically wrong unit. Only use a preset that matches what the underlying value actually represents.

##### Precedence

`formatValue` always wins if provided — it's a full custom formatting function and bypasses `format`/`decimalPlaces` entirely:

```tsx
<CardWidget
  formatValue={(v) => `${v.toFixed(2)} % RH`}
  labelText={(ts) => `As of ${new Date(ts).toLocaleDateString()}`}
/>
```

> Long `formatValue` output (e.g. `"56.00 % RH"`) may wrap onto a second line at small widths — the value slot wraps rather than overflowing. See [Sizing](#sizing) for how this interacts with a fixed `height`.

---

#### The last-updated label

By default, the label under the value shows a fixed clock time (`"Updated 14:32:10"`). This can be changed with `labelFormat`, or fully replaced with `labelText`.

##### `timezone` — override auto-detection

```tsx
<CardWidget {...commonProps} labelFormat="datetime" timezone="America/New_York" />
// shows the timestamp converted to Eastern time, regardless of the visitor's own browser timezone
```

If omitted, the widget uses `Intl.DateTimeFormat().resolvedOptions().timeZone` — the browser's own detected timezone. Pass any IANA timezone name (e.g. `"Asia/Kolkata"`, `"Europe/London"`) to force a specific one instead — useful for dashboards where all viewers should see times in the device's local timezone rather than their own.

`timezone` affects the `time`, `date`, and `datetime` label presets. It has no effect on `relative` (a time difference is timezone-independent) or `iso` (ISO 8601 output is always UTC by definition).

##### `labelFormat` — named presets

```tsx
<CardWidget {...commonProps} labelFormat="relative" />
// "5 minutes ago" instead of "Updated 14:32:10"

<CardWidget {...commonProps} labelFormat="date" />
// "Updated 7/24/2026"
```

Available presets:

| Preset           | Output example                    |
| ---------------- | --------------------------------- |
| `time` (default) | `"Updated 14:32:10"`              |
| `date`           | `"Updated 7/24/2026"`             |
| `datetime`       | `"Updated 7/24/2026, 2:32:10 PM"` |
| `relative`       | `"5 minutes ago"`                 |
| `iso`            | `"2026-07-24T14:32:10.000Z"`      |

##### `labelText` — full custom control

`labelText` always takes precedence over `labelFormat` and receives the raw timestamp, so you can use it for anything the presets don't cover — 12-hour/AM-PM formatting, hours-only, non-default locales, or combining relative time with custom surrounding text:

```tsx
// AM/PM, 12-hour
<CardWidget
  labelText={(ts) => {
    const d = new Date(ts < 1e12 ? ts * 1000 : ts);
    return `Updated ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }}
/>;
// "Updated 2:32 PM"

// Combining relative time with custom text
import { relativeTime } from "public-widget-sdk/formatters";

<CardWidget labelText={(ts) => `Last synced ${relativeTime(ts)}`} />;
// "Last synced 5 minutes ago"
```

`labelFormat` covers the common cases with zero code; `labelText` is the general escape hatch for everything else — the same relationship `formatValue` has with `format`.

---


#### Error & empty states

The card distinguishes between three outcomes of a fetch, each rendered differently:

| State | When it happens | Default appearance |
|---|---|---|
| Success | Data was fetched normally | The formatted value, unit, and label |
| Error | The fetch failed (network error, bad request, etc.) | The error message, styled via the `error` slot |
| Empty | The fetch succeeded, but no data exists yet for this variable | `"N/A"`, styled via the `empty` slot |

Both `error` and `empty` are real slots, so they pick up theme colors automatically and can be restyled the same way as any other slot:

```tsx
<CardWidget
  {...commonProps}
  styles={{
    error: "text-orange-500 italic",
    empty: "text-slate-300",
  }}
/>
```

##### `renderError` / `renderEmpty` — full custom rendering

For full control beyond just restyling text, `renderError` and `renderEmpty` let you replace the entire error/empty state with your own JSX:

```tsx
<CardWidget
  {...commonProps}
  renderError={(error) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-orange-500">⚠ Sensor unreachable</span>
      <span className="text-xs text-slate-400">{error}</span>
    </div>
  )}
  renderEmpty={() => <span className="text-slate-300">— no reading yet —</span>}
/>
```

`renderError` receives the raw error message string; `renderEmpty` takes no arguments. When either is provided, it fully replaces the default `error`/`empty` slot rendering — the corresponding `styles.error`/`styles.empty` classes are ignored in that case, since there's no default element left for them to apply to.

##### Reacting to errors/empty state via `onDataChange`

`onDataChange` now receives a second argument describing which state just occurred, so you can react to errors or empty data the same way you already react to values:

```tsx
<CardWidget
  {...commonProps}
  onDataChange={(data, meta) => {
    if (meta.kind === "error") {
      return { renderError: () => <span className="italic">Offline</span> };
    }
    if (meta.kind === "empty") {
      return { renderEmpty: () => <span className="text-slate-300">Waiting for first reading…</span> };
    }
    if (!data) return;
    if (data.value > 80) {
      return { title: "High Humidity", theme: "dark" };
    }
  }}
/>
```

`meta.kind` is one of `"success"`, `"error"`, or `"empty"`; `meta.error` is present only when `meta.kind === "error"`, carrying the underlying error message.

This is backwards compatible — existing `onDataChange={(data) => {...}}` callbacks that ignore the second argument continue to work unchanged.

---

#### Formatters export

The formatting helpers used internally are also available as a standalone import, for composing into your own `labelText`/`formatValue` functions:

```tsx
import { relativeTime } from "public-widget-sdk/formatters";
```

| Export         | Signature                                        | Description                                                                                             |
| -------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `relativeTime` | `(timestamp: number, locale?: string) => string` | Converts a timestamp into a human-relative string (`"5 minutes ago"`). Accepts seconds or milliseconds. |

#### Sizing

`width` / `height` / `minWidth` / `maxWidth` are plain props, applied as inline styles on the container — independent of the whole `styles`/theme system:

```jsx
<CardWidget width={320} height={200} minWidth={280} maxWidth={400} />
```

##### `height` has two distinct modes

Whether you pass `height` changes how the card behaves — this is intentional, not a quirk:

|                      | Behavior                                                                                                                                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`height` omitted** | The card **auto-grows** to fit its content. If `formatValue`/`labelText` produce long text that wraps, the card simply becomes taller. Sizing scales with **width only**.                                                                                                                               |
| **`height` passed**  | The card becomes a **fixed-size box**. Sizing scales with **both width and height** (see [Responsive sizing](#responsive-sizing)). If content is too tall to fit (e.g. a long wrapped value at a small height), it is **clipped**, not overflowed — the card will not grow past the height you gave it. |

```jsx
// Auto-height: card grows to fit content, whatever that content turns out to be
<CardWidget node={node} variable="humidity" />

// Fixed-height: card is exactly 300px tall; content that doesn't fit is clipped
<CardWidget node={node} variable="humidity" height={300} width={700} />
```

If you're using a `formatValue` that can produce long strings, either don't pass a fixed `height` (let the card grow to fit), or pass a `height` generous enough for the wrapped text at your chosen `width`.

---

#### Responsive sizing

The widget automatically scales its internal spacing and typography using **CSS Container Queries** — based on the card's own rendered size, not the browser viewport.

By default the following properties scale automatically:

- container padding
- title font size
- value font size
- unit font size
- label font size
- spacing (`gap`)

**When `height` is omitted**, scaling responds to the card's **width only** (`cqw`).

**When `height` is passed**, scaling responds to **both width and height** (`cqw` + `cqh`) — a taller fixed-size card renders bigger text/gaps than a shorter one at the same width, in addition to width's usual effect.

A card inside a narrow dashboard column will use smaller typography than the same card rendered full-width, even on the same screen — this behavior is built in and needs no configuration.

##### Overriding responsive sizing

If you provide your own font-size utility for a slot, you're opting out of the default responsive sizing for that slot.

```tsx
<CardWidget
  styles={{
    value: "text-6xl",
  }}
/>
```

The value will always render at `text-6xl`. Likewise, responsive Tailwind classes (`text-2xl md:text-5xl`) take precedence over the widget's default responsive sizing — your classes always win over the widget defaults.

---

#### Loading & error states

While the initial fetch is in flight, the card renders **skeleton loaders** in place of the value and label — pulsing placeholder blocks sized to match each slot's current font-size variable (`var(--anedya-card-value-size)` / `var(--anedya-card-label-size)`), so the skeleton scales along with the card exactly like the real content would.

If the fetch fails or no data is available, the card renders the error message text in place of the value (title still renders normally).

Neither state currently accepts style overrides via `styles` — flag it if you need to customize their appearance.

---

#### Other props

| Prop            | Type     | Description                                                                        |
| --------------- | -------- | ---------------------------------------------------------------------------------- |
| `title`         | `string` | Card title. Default: `"Latest Value"`                                              |
| `unit`          | `string` | Unit suffix shown next to the value                                                |
| `decimalPlaces` | `number` | Decimal places for the displayed value (used only if `formatValue` isn't provided) |

---

### GaugeWidget

An arc-style dial widget — shows a single value as a needle or filled arc between a `min` and `max`, with optional tick marks, a title, and a last-updated label.

```jsx
<GaugeWidget
  node={node}
  variable="windSpeed"
  title="Wind Speed"
  min={0}
  max={100}
  unit="km/h"
/>
```

#### Required props

| Prop       | Type     | Description                      |
| ---------- | -------- | --------------------------------- |
| `node`     | `any`    | `anedya.newNode(client, nodeId)` |
| `variable` | `string` | Variable name to display         |

> `node` is only required for **live-fetch mode**. `GaugeWidget` also supports a manual/static `value` mode that doesn't need a `node` at all — see [Manual value mode](#manual-value-mode--using-gauge-without-a-node) below.

---

#### The styling model

Like `CardWidget`, every visual piece of the gauge is a named **slot**, styled via CSS classes rather than inline styles:

```ts
type GaugeSlot =
  | "container"
  | "title"
  | "unit"
  | "track"
  | "bar"
  | "needle"
  | "needleCap"
  | "value"
  | "label"
  | "tick"
  | "tickLabel"
  | "error"
  | "empty";
```

`track`, `bar`, `needle`, `needleCap`, `tick`, and `tickLabel` are all SVG elements — their color comes from the CSS `color` property via `currentColor` (e.g. `styles={{ bar: "text-indigo-500" }}`), rather than `fill`/`stroke`-specific Tailwind utilities.

> **`track`, `bar`, `needle`, and `needleCap` have no default color class** — unlike `title`/`value`/`label`/`unit`, these four slots render invisible/black unless a theme (built-in or custom) sets a color, or you supply one directly via the `color`/`track.color`/`needle.needleColor` props (see [Arc, track, bar & needle](#arc-track-bar--needle) below).

---

#### `styles` vs `className`

Identical behavior to `CardWidget` — `styles` reaches any inner slot, `className` only touches the outermost container, and both compose together via `twMerge`:

```jsx
<GaugeWidget
  className="shadow-lg"
  styles={{
    value: "text-red-500 text-5xl",
    title: "uppercase tracking-wider",
    bar: "text-emerald-500",
  }}
/>
```

> Same rule as Card: `styles` classes must already exist in your app's compiled CSS — the widget doesn't generate CSS for them at build time.

---

#### Theming

`theme` accepts a built-in preset name or a full custom `WidgetTheme<GaugeSlot>` object:

```jsx
const emeraldTheme = {
  styles: {
    container: "",
    title: "text-emerald-700",
    unit: "text-emerald-600",
    label: "text-emerald-400",
    track: "text-emerald-100",
    bar: "text-emerald-500",
    needle: "text-emerald-800",
    needleCap: "text-emerald-800",
    value: "text-emerald-900",
    tick: "text-emerald-200",
    tickLabel: "text-emerald-500",
    error: "text-red-600",
    empty: "text-emerald-300",
  },
};

<GaugeWidget theme={emeraldTheme} />
// or
<GaugeWidget theme="dark" />   // built-in preset, or "light" (default)
```

Since `track`/`bar`/`needle`/`needleCap` have no built-in default color, a custom theme should set all of them explicitly — otherwise those elements fall back to unstyled `currentColor` inheritance from the page, not a sensible default.

---

#### Tailwind responsive utilities

Same mechanism as `CardWidget` — Tailwind's responsive prefixes work inside `styles` and are driven by the **browser viewport**, independent of the widget's own size:

```jsx
<GaugeWidget
  styles={{
    value: "text-2xl md:text-4xl xl:text-6xl",
  }}
/>
```

> **Exception — `tickLabel` font size:** the `tickLabel` slot's font size is always set via inline style from `tick.labelSize` (so it reliably scales with the tick geometry), which wins over any `text-*` class you put on `styles.tickLabel`. Use `tick.labelSize` to change tick label size; use `styles.tickLabel` for everything else (color, weight, tracking).

---

#### `onDataChange` — data-driven rendering

Same shape and precedence rules as `CardWidget`, with a gauge-specific data payload:

```ts
{
  value: number;
  timestamp: number;
}
```

```tsx
<GaugeWidget
  onDataChange={(data, meta) => {
    if (!data) return;

    const isCritical = data.value > 90;
    return {
      title: isCritical ? "Critical" : "Normal",
      color: isCritical ? "#ef4444" : "#10b981",
      needle: { needleColor: isCritical ? "#ef4444" : "#10b981" },
      styles: {
        value: isCritical ? "text-red-500 animate-pulse" : "text-white",
      },
    };
  }}
/>
```

Returning `undefined` (or nothing) clears any previous overrides and restores the widget's original props. `meta` behaves identically to Card's — see [Error & empty states](#error--empty-states).

> **`onDataChange` only fires from live-fetch data.** In [manual value mode](#manual-value-mode--using-gauge-without-a-node) (no `node`), the fetch effect never runs, so `onDataChange` is always called with `data: null` exactly once and never again — it will not react to changes in your static `value` prop.

---

#### How props are resolved

Same layering as `CardWidget`:

1. The props you pass to `<GaugeWidget />`
2. Any temporary overrides returned from `onDataChange`
3. Theme resolution (`"light"`, `"dark"`, or a custom `WidgetTheme`)
4. Per-slot class resolution

For each slot, classes are merged in this order:

1. `GAUGE_DEFAULT_CLASSES`
2. Active theme classes
3. `styles`

Later layers win on Tailwind conflicts, resolved via `twMerge`. `className` is separate from this chain and merges onto the outer container after `container` resolves.

> **Rule of thumb:** defaults → theme → `styles` → `onDataChange`. User overrides always win.

---

#### Formatting vs rendering

`format`, `formatOptions`, `decimalPlaces`, and `formatValue` follow the exact same precedence as `CardWidget`: `formatValue` → `format` → `decimalPlaces` → raw value.

```tsx
<GaugeWidget node={node} variable="freeMemory" min={0} max={1e9} format="bytes" />
// renders "512" + "MB"

<GaugeWidget node={node} variable="temperature" formatValue={(v) => `${v.toFixed(1)}°`} />
```

Preset table is identical to Card's — see [Formatters export](#formatters-export). `formatOptions` uses the same shape:

```ts
{
  locale?: string;
  binary?: boolean;      // bytes only
  toDecimalPlaces?: number;
}
```

> **Gauge clamps the value before formatting.** Unlike Card (which displays the raw fetched number as-is), Gauge always clamps the value to `[min, max]` first — `formatValue`/`format`/`decimalPlaces` all receive the **clamped** value, not the raw one. A reading of `120` on a `min={0} max={100}` gauge displays as `100`.

##### Tick labels reuse the same `format` preset

If `tick.show` is `true` and you haven't set `tick.labelFormat`, tick labels automatically use the same `format`/`formatOptions` as the main value — so the big number and the ring of tick labels stay unit-consistent without extra config:

```tsx
<GaugeWidget
  min={0}
  max={1000}
  format="bytes"
  tick={{ show: true, count: 4 }}
/>
// tick labels: 0 B, 250 B, 500 B, 750 B, 1000 B — same scaling as the main value
```

Set `tick.labelFormat` to override just the ticks independently of the main value's formatting.

---

#### The last-updated label

Identical to `CardWidget` — `timezone`, `labelFormat`, `labelText` all work the same way, with the same preset table and precedence (`labelText` > `labelFormat` > default `"time"`).

```tsx
<GaugeWidget {...commonProps} labelFormat="relative" timezone="Asia/Kolkata" />
```

One gauge-specific addition: in [manual value mode](#manual-value-mode--using-gauge-without-a-node), there's no fetched timestamp to show a label for — Gauge falls back to the time the component **mounted**, captured once, so the label still renders something meaningful instead of disappearing entirely when you're driving the gauge with a static `value` prop.

---

#### Manual value mode — using Gauge without a `node`

Unlike `CardWidget`, `GaugeWidget` accepts a plain `value` prop and can render without ever fetching data:

```tsx
<GaugeWidget value={73} min={0} max={100} title="Custom Level" />
```

This is useful for gauges driven by something other than an Anedya node — a slider, computed value, form state, or a preview/demo context.

When both `node` and `value` are supplied, live-fetched data always wins once it arrives — `value` only shows while no fetched value is available yet (e.g. before the first fetch resolves, or if `node` is omitted entirely).

> `loading`, `error`, and empty states are exclusively products of the live-fetch path — they never trigger in manual value mode, since the fetch effect itself never runs without a `node`.

---

#### Error & empty states

Same three-outcome model as `CardWidget`, applicable only when using `node` (live-fetch mode):

| State | When it happens | Default appearance |
|---|---|---|
| Success | Data was fetched normally | The arc/needle at the value, plus formatted value and label |
| Error | The fetch failed | The error message, styled via the `error` slot |
| Empty | The fetch succeeded, but no data exists yet | `"N/A"`, styled via the `empty` slot |

```tsx
<GaugeWidget
  {...commonProps}
  styles={{ error: "text-orange-500 italic", empty: "text-slate-300" }}
/>
```

##### `renderError` / `renderEmpty`

```tsx
<GaugeWidget
  {...commonProps}
  renderError={(error) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-orange-500">⚠ Sensor unreachable</span>
      <span className="text-xs text-slate-400">{error}</span>
    </div>
  )}
  renderEmpty={() => <span className="text-slate-300">— no reading yet —</span>}
/>
```

Same rule as Card: when either is provided, it fully replaces the default `error`/`empty` element, so `styles.error`/`styles.empty` no longer apply.

##### `onDataChange` meta

```tsx
<GaugeWidget
  {...commonProps}
  onDataChange={(data, meta) => {
    if (meta.kind === "error") return { renderError: () => <span className="italic">Offline</span> };
    if (meta.kind === "empty") return { renderEmpty: () => <span>Waiting…</span> };
    if (!data) return;
    if (data.value > 90) return { title: "Critical", color: "#ef4444" };
  }}
/>
```

`meta.kind` is `"success" | "error" | "empty"`; `meta.error` is present only when `meta.kind === "error"`.

---

#### Arc, track, bar & needle

Gauge geometry is configured through four independent props.

##### `arc` — the shape of the dial

```ts
interface GaugeArcConfig {
  startAngle?: number;   // degrees, 0 = 12 o'clock, clockwise-positive. Default -90
  endAngle?: number;     // Default 90
  radius?: number;       // px — auto-fit to available space if omitted
  thickness?: number;    // px — auto-computed from radius if omitted
  cornerRadius?: number; // rounds the ends of the bar/track. Default 0
}
```

```tsx
<GaugeWidget arc={{ startAngle: -135, endAngle: 135 }} />  // wider, near-full-circle dial
<GaugeWidget arc={{ startAngle: 0, endAngle: 360 }} />     // full circle / donut
<GaugeWidget arc={{ cornerRadius: 8 }} />                  // rounded bar ends
```

##### `track` — the background ring

```ts
interface GaugeTrackConfig {
  show?: boolean;  // default true
  color?: string;  // any CSS color — hex/rgb/hsl/named. Falls back to `currentColor` (styles.track) if unset
}
```

##### `color` — the filled bar

Accepts a flat color or a gradient array — **this is a raw SVG fill value, not a Tailwind class**:

```tsx
<GaugeWidget color="#10b981" />
<GaugeWidget color="rgb(99,102,241)" />
<GaugeWidget color={["#000000", "#8b5cf6", "#f9a8d4"]} />  // linear gradient across the bar
```

For a Tailwind-class-driven bar color instead, use `styles={{ bar: "text-indigo-500" }}` — the two mechanisms are independent; `color` always wins over `styles.bar` when both are set, since `color` overrides the `currentColor` fallback entirely.

##### `needle`

```ts
interface GaugeNeedleConfig {
  show?: boolean;                                  // default true
  type?: "line" | "rounded" | "drop" | "triangle";  // default "rounded"
  length?: "short" | "medium" | "full" | number;    // default "medium"
  width?: number;                                   // default 4
  color?: string;                                   // shorthand for both needleColor and capColor
  needleColor?: string;
  capColor?: string;
  capRadius?: number;                                // default 6
  animation?: boolean;                               // default true — see Animation below
}
```

```tsx
<GaugeWidget needle={{ type: "triangle", length: "full", needleColor: "#334155" }} />
```

##### No-needle ("donut") mode

Setting `needle={{ show: false }}` switches the gauge into a donut-style display — the value/unit/label are centered directly over the arc instead of rendered below it:

```tsx
<GaugeWidget needle={{ show: false }} color="#10b981" />
```

---

#### Tick marks

```ts
interface GaugeTickConfig {
  show?: boolean;                          // default false
  count?: number;                          // number of INTERVALS, not marks. Default 10 → 11 marks (0,10,...100)
  size?: number;                           // tick line length in px. Default 6
  color?: string;                          // falls back to currentColor (styles.tick)
  radiusOffset?: number;                   // gap between arc's outer edge and tick line start. Default 4
  labelGap?: number;                       // gap between tick line and its label. Default 4
  labelSize?: number;                      // tick label font size in px. Default 10
  labelColor?: string;                     // falls back to currentColor (styles.tickLabel)
  labelFormat?: (value: number) => string; // overrides the auto-reused `format` preset (see above)
}
```

```tsx
<GaugeWidget min={0} max={50} tick={{ show: true, count: 5 }} />
// marks at 0, 10, 20, 30, 40, 50
```

The gauge automatically reserves extra space around the arc for the tick ring so ticks are never clipped by the SVG viewBox — this shrinks the drawn arc radius slightly whenever `tick.show` is `true`, which is expected.

---

#### Animation

```ts
interface GaugeAnimationConfig {
  show?: boolean;      // default true
  duration?: number;   // ms. Default 1000
  easing?: GaugeEasing; // default "cubicOut"
}
```

```tsx
<GaugeWidget animation={{ duration: 400, easing: "elasticOut" }} />
<GaugeWidget animation={{ show: false }} />  // arc/needle snap to value instantly, no tween
```

`easing` accepts any of d3-ease's standard names in short form: `linear`, `quadIn/Out/InOut`, `cubicIn/Out/InOut`, `sinIn/Out/InOut`, `expIn/Out/InOut`, `circleIn/Out/InOut`, `backIn/Out/InOut`, `elasticIn/Out/InOut`, `bounceIn/Out/InOut`.

> The needle only animates when **both** `needle.animation` and `animation.show` are `true`. `animation.show: false` disables the bar's arc-fill animation as well as the needle's, regardless of `needle.animation`; `needle.animation: false` disables only the needle while the bar still tweens.

---

#### Sizing

```jsx
<GaugeWidget width={320} height={200} minWidth={200} maxWidth={480} />
```

Unlike `CardWidget`, the gauge has no auto-grow-to-content mode — it always fills whatever box it's given (its own container, or `width`/`height`/`size`), and the arc's radius is computed to fit that box.

##### `size`

A single number that fixes both width and height to a square-ish box and disables automatic size-tracking entirely — use this for a fixed, non-fluid gauge:

```tsx
<GaugeWidget size={200} />
```

##### Automatic sizing

Without `size`, the gauge always tracks its parent container's actual rendered dimensions (via a `ResizeObserver`) and redraws the arc to fit — no separate flag needed to enable this, it's the default behavior whenever `size` is unset:

```tsx
<GaugeWidget width="100%" height={240} />        // fixed pixel height, fluid width
<GaugeWidget style={{ width: "100%", height: "100%" }} />  // fills a sized parent
```

If neither the parent nor `width`/`height`/`aspectRatio` constrain the box, the gauge falls back to a `240×163`px default.

---

#### Loading & error states

While the initial fetch is in flight (live-fetch mode only), the gauge renders pulsing skeleton blocks in place of the value and label, sized to the current `--anedya-gauge-value-size` / `--anedya-gauge-label-size` CSS variables. The arc itself dims to reduced opacity rather than being replaced by a skeleton.

Neither loading nor error states currently accept style overrides via `styles` beyond the `error`/`empty` slots described above.

---

#### Other props

| Prop            | Type     | Description                                                                        |
| --------------- | -------- | ------------------------------------------------------------------------------------ |
| `title`         | `string` | Gauge title. Default: `"Latest Value"`                                              |
| `value`         | `number` | Manual/static value — see [Manual value mode](#manual-value-mode--using-gauge-without-a-node) |
| `min`           | `number` | Minimum of the value range. Default `0`                                             |
| `max`           | `number` | Maximum of the value range. Default `100`                                           |
| `unit`          | `string` | Unit suffix shown next to the value (ignored while `format` is active)              |
| `decimalPlaces` | `number` | Decimal places for the displayed value (used only if `formatValue`/`format` aren't provided) |

## Stylesheet import

This SDK ships pre-compiled CSS alongside its JavaScript — you don't need Tailwind configured in your own project for these widgets to render correctly, even if you don't use Tailwind at all.

**Import the stylesheet once**, anywhere in your app's entry point (e.g. `main.tsx`, `App.tsx`, or your global styles file):

```jsx
import "public-widget-sdk/styles.css";
```

That's the entire integration on your end. No `content` glob changes to your `tailwind.config`, no build coordination, nothing else required — every widget in this SDK will render fully styled as soon as this import is present.

> **If styles aren't appearing:** double-check the import path matches your installed package name exactly, and that it's imported somewhere that actually runs before your widgets render (e.g. not inside a conditionally-loaded file). If you're using a bundler with strict CSS module resolution, confirm it supports subpath imports from `node_modules` (most modern bundlers — Vite, Webpack 5+, Next.js — do, out of the box).
