[<img alt="PyPI" src="https://img.shields.io/npm/v/%40anedyasystems%2Fanedya-widgets-react?style=for-the-badge">](https://www.npmjs.com/package/@anedyasystems/anedya-widgets-react)&nbsp;&nbsp;[<img alt="Anedya Documentation" src="https://img.shields.io/badge/Anedya-Documentation-blue?style=for-the-badge">](https://docs.anedya.io?utm_source=github&utm_medium=link&utm_campaign=github-sdk&utm_content=js)

<!---<div style="width:20%; margin:0 auto;margin-bottom:50px;margin-top:50px;">-->
<p align="center">
    <img src="https://cdn.anedya.io/anedya_black_banner.png" alt="Logo">
</p>
<!--</div>-->

# Anedya Widgets SDK

A collection of pre-built, themeable React widgets for displaying Anedya IoT data in dashboards and front-end applications.

Designed for developers using the Anedya Frontend SDK, the library provides drop-in UI components that fetch and display device data with minimal setup. Each widget is fully customizable through themes, Tailwind classes, and component props, making it easy to match your application's design while avoiding repetitive UI implementation.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Widgets](#widgets)
  - [AnedyaCard](#AnedyaCard)
    - [Required props](#required-props)
    - [Manual vs live values](#manual-vs-live-values)
    - [The styling model](#the-styling-model)
    - [`styles` vs `className`](#styles-vs-classname--the-distinction-that-matters-most)
    - [Theming](#theming)
    - [Tailwind responsive utilities](#tailwind-responsive-utilities)
    - [`onDataChange` — data-driven rendering](#ondatachange--data-driven-rendering)
    - [How props are resolved](#how-props-are-resolved)
  - [AnedyaGauge](#AnedyaGauge)
    - [Required props](#required-props-1)
    - [Manual vs live values](#manual-vs-live-values)
    - [Slots & styling](#slots--styling)
    - [Theming](#theming-1)
    - [Arc configuration](#arc-configuration)
    - [Track configuration](#track-configuration)
    - [Bar color & gradients](#bar-color--gradients)
    - [Needle configuration](#needle-configuration)
    - [Needle-less (donut) mode](#needle-less-donut-mode)
    - [Tick marks](#tick-marks)
    - [Tooltip](#tooltip)
    - [Animation configuration](#animation-configuration)
    - [`onDataChange` — data-driven rendering](#ondatachange--data-driven-rendering-1)
    - [How props are resolved](#how-props-are-resolved-1)
- [Common](#common)
  - [Formatting vs rendering](#formatting-vs-rendering)
  - [The last-updated label](#the-last-updated-label)
  - [Error & empty states](#error--empty-states)
  - [Formatters export](#formatters-export)
  - [Sizing](#sizing)
  - [Responsive sizing](#responsive-sizing)
  - [Loading & error states](#loading--error-states)
  - [Other props](#other-props)
- [Stylesheet import](#stylesheet-import)

---

## Installation & Setup

Widgets in this SDK don't create their own Anedya client or node — they only render data you fetch through the [Anedya Frontend SDK](https://www.npmjs.com/package/@anedyasystems/anedya-frontend-sdk), which is a separate package you'll need alongside this one.

**1. Install both packages:**

```bash
npm install @anedyasystems/anedya-frontend-sdk @anedyasystems/anedya-widgets-react
```

**2. Import the stylesheet once**, anywhere in your app's entry point:

```jsx
import "@anedyasystems/anedya-widgets-react/styles.css";
```

**3. Create a client and node using the Frontend SDK, then pass the node into any widget:**

```jsx
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { AnedyaCard } from "@anedyasystems/anedya-widgets-react";
import "anedya-widgets-react/styles.css";

const anedya = new Anedya();
const config = anedya.newConfig(tokenId, token);
const client = anedya.newClient(config);
const node = anedya.newNode(client, nodeId);

<AnedyaCard node={node} variable="humidity" />;
```

> `tokenId`, `token`, and `nodeId` come from your Anedya account/device setup — see the [Frontend SDK docs](https://www.npmjs.com/package/@anedyasystems/anedya-frontend-sdk) for details on obtaining these and on other `node`/`client` methods (fetching historical data, live streaming, key-value store, etc.) beyond what these widgets use directly.

---

## Widgets

### AnedyaCard

A single-value display widget — shows the latest reading, a title, and a last-updated label.

```jsx
<AnedyaCard
  node={node}
  variable="humidity"
  title="Humidity"
  unit="%"
  decimalPlaces={1}
/>
```

#### Required props

| Prop       | Type     | Description                                                              |
| ---------- | -------- | ---------------------------------------------------------------------------- |
| `node`     | `any`    | `anedya.newNode(client, nodeId)` — omit only if using `value` for a fully controlled widget (see below) |
| `variable` | `string` | Variable name to display — required whenever `node` is provided               |

---

#### Manual vs live values

Like `AnedyaGauge`, `AnedyaCard` can also render **without** a live `node` fetch — pass `value` directly for a fully controlled card:

```jsx
<AnedyaCard value={72} unit="%" title="Manual reading" />
```

If both a `node`/`variable` fetch *and* a `value` prop are present, the fetched value takes over once it arrives — `value` acts as the initial/fallback reading until then.

`onDataChange` reflects live fetched data only — it does not fire based on the manual `value` prop.

---

#### The styling model

`AnedyaCard` is **entirely class-based** — every visual choice is a CSS class string, not a style property. This is deliberate: card widgets are commonly styled with Tailwind, and classes compose and override far more predictably than inline styles do once you're combining a theme, a per-instance override, and a conditional rule all on the same element.

Every part of the card is a named **slot**:

```ts
type CardSlot = "container" | "title" | "value" | "unit" | "label";
```

---

#### `styles` vs `className` — the distinction that matters most

These look similar but do genuinely different things:

|             | Shape                 | Targets                                                              | Purpose                                                |
| ----------- | ---------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| `styles`    | object, keyed by slot  | any inner slot (`title`, `value`, `unit`, `label`) _and_ `container` | reach inside the widget                                  |
| `className` | plain string           | only the outermost container element                                  | the ordinary React convention every component supports  |

```jsx
<AnedyaCard
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

<AnedyaCard theme={emeraldTheme} />
// or
<AnedyaCard theme="dark" />   // built-in preset, or "light" (default)
```

---

#### Tailwind responsive utilities

You can freely use Tailwind's responsive prefixes inside `styles`:

```tsx
<AnedyaCard
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
<AnedyaCard
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

`onDataChange` also receives a second argument describing which state just occurred — see [Error & empty states](#error--empty-states) below for the full `meta` shape and examples reacting to errors/empty data.

---

#### How props are resolved

Rendering happens in layers.

1. The props you pass to `<AnedyaCard />`
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

### AnedyaGauge

A radial arc gauge — shows a single value as a filled arc with an optional needle, min/max tick marks, and a last-updated label.

```jsx
<AnedyaGauge
  node={node}
  variable="temperature"
  title="Temperature"
  unit="°C"
  min={0}
  max={100}
/>
```

> **Default behaviour:** simply pass `node` and `variable` — the gauge renders with the light theme, title `"Latest Value"`, no tick marks, and the last‑updated label showing the current time.

#### Required props


| Prop       | Type     | Description                                                              |
| ---------- | -------- | ---------------------------------------------------------------------------- |
| `node`     | `any`    | `anedya.newNode(client, nodeId)` — omit only if using `value` for a fully controlled widget (see below) |
| `variable` | `string` | Variable name to display — required whenever `node` is provided               |

---

#### Manual vs live values

Unlike `AnedyaCard`, `AnedyaGauge` can also render **without** a live `node` fetch — pass `value` directly for a fully controlled gauge (e.g. driven by your own state, a slider, or a value computed elsewhere in your app):

```jsx
<AnedyaGauge value={72} min={0} max={100} unit="%" />
```

If both a `node`/`variable` fetch *and* a `value` prop are present, the fetched value takes over once it arrives — `value` acts as the initial/fallback reading until then.

`min` and `max` (default `0` / `100`) define the gauge's range regardless of which mode you're in. The displayed value is always clamped into `[min, max]` before it's drawn or formatted.

---

#### Slots & styling

Like `AnedyaCard`, every part of the gauge is a named **slot**, and the same `styles` (per-slot) / `className` (outer container only) system applies:

```ts
type GaugeSlot =
  | "container" | "title" | "unit" | "track" | "bar"
  | "needle" | "needleCap" | "value" | "label"
  | "tick" | "tickLabel" | "tooltip" | "error" | "empty";
```

```jsx
<AnedyaGauge
  className="shadow-lg"          // outer box only
  styles={{
    value: "text-red-500 text-4xl",
    bar: "text-emerald-500",     // arc fill reads this via currentColor
    needle: "text-slate-800",
  }}
/>
```

> **Note:** `track`, `bar`, `needle`, and `needleCap` are SVG shapes, not text — their "color" comes from `currentColor`, which is why these slots are styled with Tailwind text-color utilities (`text-emerald-500`) rather than `fill-*`/`stroke-*` classes.

---

#### Theming

`theme` works exactly as it does for `AnedyaCard` — a preset name, or a custom `WidgetTheme<GaugeSlot>` object:

```jsx
const emeraldGaugeTheme = {
  styles: {
    bar: "text-emerald-500",
    track: "text-emerald-100",
    value: "text-emerald-900",
    needle: "text-emerald-700",
    needleCap: "text-emerald-700",
    tooltip: "bg-emerald-200 text-emerald-700",
  },
};

<AnedyaGauge theme={emeraldGaugeTheme} />
// or
<AnedyaGauge theme="dark" />   // built-in preset, or "light" (default)
```

---

#### Arc configuration

`arc` controls the shape of the gauge itself:

```jsx
<AnedyaGauge
  arc={{
    startAngle: -120,   // degrees, 0 = 12 o'clock, clockwise-positive
    endAngle: 120,
    radius: 90,          // px; auto-fit to the container if omitted
    thickness: 14,        // px; defaults to ~18% of radius if omitted
    cornerRadius: 6,      // rounds the ends of the arc/bar
  }}
/>
```

| Prop           | Type     | Default                    | Description                                                          |
| -------------- | -------- | ---------------------------- | ------------------------------------------------------------------------ |
| `startAngle`   | `number` | `-90`                        | Degrees, `0` = 12 o'clock, clockwise-positive                            |
| `endAngle`     | `number` | `90`                         | Degrees, same convention as `startAngle`                                 |
| `radius`       | `number` | auto-fit to container        | Capped to whatever actually fits the current width/height/tick space     |
| `thickness`    | `number` | `~18%` of resolved radius     | Arc/bar stroke width in px                                                |
| `cornerRadius` | `number` | `0`                           | Rounds the ends of both the track and the value bar                       |

A default `startAngle`/`endAngle` of `-90`/`90` draws the classic bottom half-circle speedometer; narrowing the range (e.g. `-120`/`120`) draws a fuller arc.

`radius` is a *maximum* — the gauge always shrinks it further if needed so the arc (plus tick marks, if shown) fits inside the widget's actual rendered box.

---

#### Track configuration

`track` is the background arc the value bar sits on top of:

```jsx
<AnedyaGauge track={{ show: true, color: "#e2e8f0" }} />
```

| Prop    | Type      | Default              | Description                                          |
| ------- | --------- | ---------------------- | ------------------------------------------------------- |
| `show`  | `boolean` | `true`                 | Whether the background track arc is drawn                |
| `color` | `string`  | theme's `track` slot   | Overrides the track color directly (any CSS color)        |

---

#### Bar color & gradients

`color` sets the fill of the value arc — a single color, or 2+ colors for a gradient:

```jsx
<AnedyaGauge color="#f97316" />

<AnedyaGauge color={["#22c55e", "#eab308", "#ef4444"]} />
// renders a left-to-right gradient across the filled portion of the arc
```

If omitted, the bar falls back to the theme's `bar` slot color via `currentColor`.

---

#### Needle configuration

```jsx
<AnedyaGauge
  needle={{
    show: true,
    type: "drop",          // "line" | "rounded" | "drop" | "triangle"
    length: "medium",      // "short" | "medium" | "full" | number (px)
    width: 6,
    color: "#334155",      // shorthand: sets both needleColor and capColor
    capRadius: 8,
    animation: true,
  }}
/>
```

| Prop          | Type                                            | Default          | Description                                                                     |
| ------------- | ------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------- |
| `show`        | `boolean`                                        | `true`             | Whether the needle is drawn at all                                                   |
| `type`        | `"line" \| "rounded" \| "drop" \| "triangle"`     | `"rounded"`        | Needle shape                                                                          |
| `length`      | `"short" \| "medium" \| "full" \| number`         | `"medium"`         | Preset (relative to the resolved radius) or an explicit px value                     |
| `width`       | `number`                                         | `4`                | Needle thickness in px                                                               |
| `color`       | `string`                                         | `theme`                  | Shorthand — sets both `needleColor` and `capColor` at once                           |
| `needleColor` | `string`                                         | `color` or theme   | Color of the needle shape specifically, overrides `color` for the shape only         |
| `capColor`    | `string`                                         | `color` or theme   | Color of the center cap circle specifically                                          |
| `capRadius`   | `number`                                         | `6`                | Radius of the center cap circle in px                                                |
| `animation`   | `boolean`                                        | `true`             | Whether the needle rotates smoothly to its new position                              |

`needle.animation` and the top-level `animation.show` (below) are independent switches — **both** must be `true` for the needle to animate. This lets you, for example, animate the bar fill while snapping the needle instantly, or vice versa.

---

#### Needle-less (donut) mode

Setting `needle={{ show: false }}` turns the gauge into a donut-style indicator — the value/unit/label block is centered directly over the arc instead of rendered below it:

```jsx
<AnedyaGauge needle={{ show: false }} arc={{ startAngle: -180, endAngle: 180 }} />
```

---

#### Tick marks

`tick` draws radial marks (and optional labels) around the arc between `min` and `max`. Off by default:

```jsx
<AnedyaGauge
  tick={{
    show: true,
    count: 10,          // number of INTERVALS, so 10 -> 11 marks (0,10,...,100)
    size: 6,
    radiusOffset: 4,     // gap between the arc's outer edge and the tick line
    labelGap: 4,          // gap between the tick line and its label
    labelSize: 10,         // px — always wins over any styles.tickLabel font-size class
    color: "#cbd5e1",
    labelColor: "#94a3b8",
    labelFormat: (v) => `${v}°`,
  }}
/>
```

| Prop           | Type                        | Default | Description                                                                                     |
| -------------- | ---------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `show`         | `boolean`                    | `false` | Whether tick marks are drawn                                                                         |
| `count`        | `number`                     | `10`    | Number of **intervals** between `min` and `max` — `count: 10` draws 11 marks                          |
| `size`         | `number`                     | `6`     | Tick line length in px                                                                                |
| `color`        | `string`                     | `theme`       | Tick line color; falls back to the theme's `tick` slot via `currentColor`                            |
| `radiusOffset` | `number`                     | `4`     | Gap in px between the arc's outer edge and the start of the tick line                                 |
| `labelGap`     | `number`                     | `4`     | Gap in px between the end of the tick line and its label                                              |
| `labelSize`    | `number`                     | `10`    | Tick label font size in px — set as an inline style, so it always wins over `styles.tickLabel`         |
| `labelColor`   | `string`                     | `theme`       | Tick label color; falls back to the theme's `tickLabel` slot                                          |
| `labelFormat`  | `(value: number) => string`  | —       | Custom formatter for tick numbers. If omitted, reuses the widget's `format` preset if one is set, otherwise a plain rounded number |

Enabling ticks reserves extra space inside the widget for the line + gaps + label, shrinking the arc's radius slightly so the ring is never clipped — you don't need to size the container any differently to accommodate it.

> Because `labelSize` is applied as an inline style, a `styles.tickLabel` class controlling font size will have no effect — use the `labelSize` prop for sizing, and `styles.tickLabel` / `tickLabel` theme classes for anything else (weight, tracking, etc.).

---


#### Tooltip

`tooltip` shows a hover tooltip over the arc (both the track and the filled bar respond) — enabled by default. The built-in tooltip text is `"variable: value unit"`, using the **formatted** value (`displayValue` — after `format`/`formatValue`/`decimalPlaces` is applied), not the raw number:

```jsx
<GaugeWidget node={node} variable="temperature" unit="°C" decimalPlaces={1} />
// hovering the arc shows: "temperature: 42.5 °C"
```

| Prop      | Type                                                                                              | Default | Description                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `show`    | `boolean`                                                                                              | `true`  | Whether hovering the arc shows a tooltip                                       |
| `content` | `(data: { variable: string; value: number; displayValue: string; unit?: string }) => ReactNode`      | —       | Full custom tooltip content. Receives both the **raw** clamped `value` and the already-**formatted** `displayValue`/`unit`, alongside the widget's `variable` name |

Disable it with `tooltip={{ show: false }}`, or fully replace the content with your own JSX — `content` gets the raw value in case you want to do your own formatting/thresholds rather than reuse `displayValue`:

```jsx
<GaugeWidget
  tooltip={{
    content: ({ variable, value, displayValue, unit }) => (
      <div className="flex flex-col items-center">
        <span className="font-semibold">{variable}</span>
        <span>{displayValue}{unit ? ` ${unit}` : ""}</span>
        <span className="text-xs opacity-70">raw: {value}</span>
      </div>
    ),
  }}
/>
```

The tooltip follows the pointer and flips to the opposite side automatically once the pointer crosses the horizontal midpoint of the gauge, so it never overflows off the edge of a narrow container. It's hidden automatically while the widget is in a loading, error, or empty state.

Like every other part of the gauge, the tooltip is styleable via the `tooltip` slot in `styles` or a custom theme:

```jsx
<GaugeWidget
  styles={{
    tooltip: "bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg",
  }}
/>
```
---

#### Animation configuration

`animation` controls the transition when the value (and, if enabled, the needle) moves to a new reading:

```jsx
<AnedyaGauge animation={{ show: true, duration: 800, easing: "elasticOut" }} />
```

| Prop       | Type          | Default      | Description                                                |
| ---------- | ------------- | ------------ | -------------------------------------------------------------- |
| `show`     | `boolean`     | `true`       | Whether the bar (and needle, if also enabled) animates          |
| `duration` | `number`      | `1000`       | Transition duration in ms                                       |
| `easing`   | `GaugeEasing` | `"cubicOut"` | Any of the standard d3-ease families — `easeLinear`, `easeQuadIn`, `easeQuadOut`, `easeQuadInOut`, `easeCubicIn`, `easeCubicOut`, `easeCubicInOut`, `easeSinIn`, `easeSinOut`, `easeSinInOut`, `easeExpIn`, `easeExpOut`, `easeExpInOut`, `easeCircleIn`, `easeCircleOut`, `easeCircleInOut`, `easeBackIn`, `easeBackOut`, `easeBackInOut`, `easeElasticIn`, `easeElasticOut`, `easeElasticInOut`, `easeBounceIn`, `easeBounceOut`, `easeBounceInOut` |

With `animation.show: false`, both the bar and needle snap directly to the new value with no transition, regardless of `needle.animation`.

---

#### `onDataChange` — data-driven rendering

`onDataChange` works the same way it does on `AnedyaCard` (see [`onDataChange` under AnedyaCard](#ondatachange--data-driven-rendering)) — it's called with the latest fetched reading and a `meta` object, and can return a partial set of props (including `styles`) that temporarily override the gauge's own props:

**Example 1 – change many props based on value ranges**

```tsx
<AnedyaGauge
  node={node}
  variable="pressure"
  min={0}
  max={100}
  onDataChange={(data, meta) => {
    if (!data || meta.kind !== "success") return;

    if (data.value > 80) {
      return {
        title: "🔴 High",
        color: "#ef4444",
        theme: "dark",
        arc: { startAngle: -135, endAngle: 135 },
        needle: { type: "triangle", color: "#dc2626" },
        animation: { duration: 500, easing: "elasticOut" },
        tick: { show: true, color: "#fca5a5", labelColor: "#f87171" },
        tooltip: {
          content: ({ variable, displayValue, unit }) => (
            <span className="text-red-400 font-semibold">
              ⚠ {variable}: {displayValue}{unit ? ` ${unit}` : ""} — critical
            </span>
          ),
        },
        styles: {
          value: "text-red-500 text-4xl font-black",
          title: "uppercase tracking-wide",
        },
      };
    }
    if (data.value < 20) {
      return {
        title: "🟢 Low",
        color: ["#10b981", "#34d399"],
        arc: { thickness: 18 },
        needle: { show: false },
        tooltip: { show: false }, // low readings aren't worth hovering for
      };
    }
    // Clear overrides for mid-range values — tooltip reverts to the default
  }}
/>
```

**Example 2 – custom error and empty rendering**

```tsx
<AnedyaGauge
  node={node}
  variable="sensor"
  onDataChange={(data, meta) => {
    if (meta.kind === "error") {
      return {
        renderError: (msg) => (
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <span className="text-sm text-orange-600 italic">{msg}</span>
          </div>
        ),
      };
    }
    if (meta.kind === "empty") {
      return {
        renderEmpty: () => (
          <span className="text-slate-400 animate-pulse">— waiting for first reading —</span>
        ),
      };
    }
    // No override on success
  }}
/>
```

The only difference from Card is the data shape passed in — `GaugeData` (`{ value, timestamp }`) and `GaugeDataMeta` — but the resolution behavior (temporary override until the callback runs again; `undefined`/nothing clears it) is identical.

---

#### How props are resolved

Rendering follows the same layered order as `AnedyaCard`:

1. The props you pass to `<AnedyaGauge />`
2. Any temporary overrides returned from `onDataChange`
3. Theme resolution (`"light"`, `"dark"`, or a custom `WidgetTheme<GaugeSlot>`)
4. Per-slot class resolution

For each slot (`container`, `title`, `unit`, `track`, `bar`, `needle`, `needleCap`, `value`, `label`, `tick`, `tickLabel`, `error`, `empty`), classes are merged in this order:

1. `GAUGE_DEFAULT_CLASSES`
2. Active theme classes
3. `styles`

Later layers win whenever two Tailwind utilities conflict, resolved with `twMerge`. `className` is separate from this chain — merged onto the outer container after the container slot has been resolved.

> **Rule of thumb:** defaults → theme → `styles` → `onDataChange`. User overrides always win.

---

## Common

The sections below apply to every widget in this SDK. Where behavior is identical, only the shared explanation is given once; each subsection includes an example for both `AnedyaCard` and `AnedyaGauge`.

### Formatting vs rendering

`format`, `formatOptions`, `decimalPlaces`, and `labelFormat` control **what text is displayed**.

`styles` controls **how the widget looks**.

`onDataChange` can override any of these (along with most other widget props), allowing the widget to react to incoming data.

#### `format` — named presets for common unit types

For values that need unit-aware scaling (bytes, durations, lengths, etc.), pass a `format` preset instead of manually computing a unit string:

```tsx
// AnedyaCard
<AnedyaCard node={node} variable="freeMemory" format="bytes" />
// renders "512" + "MB" — auto-scaled, no manual unit needed

<AnedyaCard node={node} variable="uptime" format="duration" />
// renders "2d 4h 12m"

<AnedyaCard node={node} variable="distance" format="length" formatOptions={{ formatOptions: 2 }} />
// renders "1.25" + "km"
```

```tsx
// AnedyaGauge
<AnedyaGauge node={node} variable="freeMemory" format="bytes" min={0} max={8_000_000_000} />
// renders "512" + "MB" on the value, and (if tick.show is on) scaled units on tick labels too

<AnedyaGauge node={node} variable="uptime" format="duration" min={0} max={86400} />
// renders "2d 4h 12m"
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
| `percent`  | 0–100           | `"45%"`                                                                                          |

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
  <AnedyaCard format="number" formatOptions={{ locale: "en-IN" }} />
  // "1,23,456" (Indian digit grouping) instead of "123,456"

  <AnedyaGauge format="number" formatOptions={{ locale: "de-DE" }} min={0} max={200000} />
  // "123.456" (German uses "." as the thousands separator, "," as the decimal point)
```

- **`formatOptions`** — control decimal places in the *scaled* output (not the raw value). Useful when the default rounding is too coarse for scientific/financial data, or you want whole numbers for a cleaner dashboard look:
```tsx
  <AnedyaCard format="bytes" formatOptions={{ formatOptions: 2 }} />
  // "512.34" + "MB" — more decimal places than the default

  <AnedyaGauge format="bytes" formatOptions={{ formatOptions: 0 }} min={0} max={1_000_000_000} />
  // "512" + "MB" — whole number, no decimals
```

- **`binary`** — *(`bytes` preset only)* choose between 1000-based and 1024-based scaling. These genuinely produce different numbers for the same raw byte count, so picking the wrong one can make a value look incorrect even though the math is technically right for the mode you're in:
```tsx
  <AnedyaCard format="bytes" formatOptions={{ binary: true }} />
  // raw 1048576 -> "1" + "MiB" — matches how OS file managers/RAM usage are usually reported

  <AnedyaCard format="bytes" />
  // raw 1048576 -> "1.05" + "MB" — matches how storage manufacturers/network specs are usually reported
```
  As a rule of thumb: use `binary: true` for memory/RAM/file-size-on-disk readings, and the default (decimal) for network throughput or storage capacity marketing figures.

**`format` takes over the `unit` slot entirely.** When set, the preset determines its own unit per value (e.g. switching from `"KB"` to `"MB"` as a byte count grows) — the `unit` prop is ignored while `format` is active. On `AnedyaGauge`, if `tick.labelFormat` isn't set, enabled tick labels also reuse the active `format` preset, so the value and the tick ring stay unit-consistent.

> **Presets don't validate that they match your data's actual meaning** — they only know how to scale a raw number. Applying `format="length"` to a Celsius reading, for example, will scale it as if it were meters and display a plausible-looking but semantically wrong unit. Only use a preset that matches what the underlying value actually represents.

#### Precedence

`formatValue` always wins if provided — it's a full custom formatting function and bypasses `format`/`decimalPlaces` entirely:

```tsx
// AnedyaCard
<AnedyaCard
  formatValue={(v) => `${v.toFixed(2)} % RH`}
  labelText={(ts) => `As of ${new Date(ts).toLocaleDateString()}`}
/>
```

```tsx
// AnedyaGauge
<AnedyaGauge
  formatValue={(v) => `${v.toFixed(1)}%`}
  labelText={(ts) => `As of ${new Date(ts).toLocaleDateString()}`}
/>
```

> Long `formatValue` output (e.g. `"56.00 % RH"`) may wrap onto a second line at small widths — the value slot wraps rather than overflowing. On `AnedyaCard` this interacts with a fixed `height` — see [Sizing](#sizing) below. On `AnedyaGauge`, the value block sits below (or centered over, in needle-less mode) the arc and wraps the same way within the available space.

---

### The last-updated label

By default, the label under the value shows a fixed clock time (`"Updated 14:32:10"`). This can be changed with `labelFormat`, or fully replaced with `labelText`.

#### `timezone` — override auto-detection

```tsx
<AnedyaCard {...commonProps} labelFormat="datetime" timezone="America/New_York" />
// commonProps = { node, variable: "humidity" }
// shows the timestamp converted to Eastern time, regardless of the visitor's own browser timezone

<AnedyaGauge {...commonProps} labelFormat="datetime" timezone="Asia/Kolkata" />
// commonProps = { node, variable: "humidity" }
// shows the timestamp converted to Indian Standard Time
```

If omitted, the widget uses `Intl.DateTimeFormat().resolvedOptions().timeZone` — the browser's own detected timezone. Pass any IANA timezone name (e.g. `"Asia/Kolkata"`, `"Europe/London"`) to force a specific one instead — useful for dashboards where all viewers should see times in the device's local timezone rather than their own.

`timezone` affects the `time`, `date`, and `datetime` label presets. It has no effect on `relative` (a time difference is timezone-independent) or `iso` (ISO 8601 output is always UTC by definition).

+> **In manual `value` mode** (either widget, no `node` provided): there's no fetched timestamp to show. The label falls back to the moment the widget first mounted, so it still renders something meaningful instead of disappearing.

#### `labelFormat` — named presets

```tsx
<AnedyaCard {...commonProps} labelFormat="relative" />
// commonProps = { node, variable: "humidity" }
// "5 minutes ago" instead of "Updated 14:32:10"

<AnedyaCard {...commonProps} labelFormat="date" />
// commonProps = { node, variable: "humidity" }
// "Updated 7/24/2026"

<AnedyaGauge {...commonProps} labelFormat="relative" />
// commonProps = { node, variable: "humidity" }
// "5 minutes ago" instead of "Updated 14:32:10"
```

Available presets:

| Preset           | Output example                    |
| ---------------- | ---------------------------------- |
| `time` (default) | `"Updated 14:32:10"`               |
| `date`           | `"Updated 7/24/2026"`              |
| `datetime`       | `"Updated 7/24/2026, 2:32:10 PM"`  |
| `relative`       | `"5 minutes ago"`                  |
| `iso`            | `"2026-07-24T14:32:10.000Z"`       |

#### `labelText` — full custom control

`labelText` always takes precedence over `labelFormat` and receives the raw timestamp, so you can use it for anything the presets don't cover — 12-hour/AM-PM formatting, hours-only, non-default locales, or combining relative time with custom surrounding text:

```tsx
// AM/PM, 12-hour
<AnedyaCard
  labelText={(ts) => {
    const d = new Date(ts < 1e12 ? ts * 1000 : ts);
    return `Updated ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }}
/>;
// "Updated 2:32 PM"

// Combining relative time with custom text
import { relativeTime } from "@anedyasystems/anedya-widgets-react/formatters";

<AnedyaCard labelText={(ts) => `Last synced ${relativeTime(ts)}`} />;
// "Last synced 5 minutes ago"

<AnedyaGauge labelText={(ts) => `Last synced ${relativeTime(ts)}`} />;
// "Last synced 5 minutes ago"
```

`labelFormat` covers the common cases with zero code; `labelText` is the general escape hatch for everything else — the same relationship `formatValue` has with `format`.

---

### Error & empty states

Every widget distinguishes between three outcomes of a fetch, each rendered differently:

| State | When it happens | Default appearance |
|---|---|---|
| Success | Data was fetched normally | The formatted value, unit, and label |
| Error | The fetch failed (network error, bad request, etc.) | The error message, styled via the `error` slot |
| Empty | The fetch succeeded, but no data exists yet for this variable | `"N/A"`, styled via the `empty` slot |

Both `error` and `empty` are real slots, so they pick up theme colors automatically and can be restyled the same way as any other slot:

```tsx
<AnedyaCard
  {...commonProps}
  styles={{
    error: "text-orange-500 italic",
    empty: "text-slate-300",
  }}
/>

<AnedyaGauge
  {...commonProps}
  styles={{
    error: "text-orange-500 italic",
    empty: "text-slate-300",
  }}
/>

//commonProps = { node, variable: "humidity" }
```

#### `renderError` / `renderEmpty` — full custom rendering

For full control beyond just restyling text, `renderError` and `renderEmpty` let you replace the entire error/empty state with your own JSX:

```tsx
<AnedyaCard
  {...commonProps}
  renderError={(error) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-orange-500">⚠ Sensor unreachable</span>
      <span className="text-xs text-slate-400">{error}</span>
    </div>
  )}
  renderEmpty={() => <span className="text-slate-300">— no reading yet —</span>}
/>

<AnedyaGauge
  {...commonProps}
  renderError={(error) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-orange-500">⚠ Sensor unreachable</span>
      <span className="text-xs text-slate-400">{error}</span>
    </div>
  )}
  renderEmpty={() => <span className="text-slate-300">— no reading yet —</span>}
/>

// commonProps = { node, variable: "humidity" }
```

`renderError` receives the raw error message string; `renderEmpty` takes no arguments. When either is provided, it fully replaces the default `error`/`empty` slot rendering — the corresponding `styles.error`/`styles.empty` classes are ignored in that case, since there's no default element left for them to apply to.

#### Reacting to errors/empty state via `onDataChange`

`onDataChange` receives a second argument describing which state just occurred, so you can react to errors or empty data the same way you already react to values:

```tsx
<AnedyaCard
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

<AnedyaGauge
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
      return { color: "#ef4444", theme: "dark" };
    }
  }}
/>

// commonProps = { node, variable: "humidity" }
```

`meta.kind` is one of `"success"`, `"error"`, or `"empty"`; `meta.error` is present only when `meta.kind === "error"`, carrying the underlying error message.

This is backwards compatible — existing `onDataChange={(data) => {...}}` callbacks that ignore the second argument continue to work unchanged.

---

### Formatters export

The formatting helpers used internally are also available as a standalone import, for composing into your own `labelText`/`formatValue` functions — usable with either widget:

```tsx
import { relativeTime } from "@anedyasystems/anedya-widgets-react/formatters";
```

| Export         | Signature                                        | Description                                                                                             |
| -------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `relativeTime` | `(timestamp: number, locale?: string) => string` | Converts a timestamp into a human-relative string (`"5 minutes ago"`). Accepts seconds or milliseconds. |

---

### Sizing

#### AnedyaCard

`width` / `height` / `minWidth` / `maxWidth` are plain props, applied as inline styles on the container — independent of the whole `styles`/theme system:

```jsx
<AnedyaCard width={320} height={200} minWidth={280} maxWidth={400} />
```

##### `height` has two distinct modes

Whether you pass `height` changes how the card behaves — this is intentional, not a quirk:

|                      | Behavior                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`height` omitted** | The card **auto-grows** to fit its content. If `formatValue`/`labelText` produce long text that wraps, the card simply becomes taller. Sizing scales with **width only**.                                                                                                                               |
| **`height` passed**  | The card becomes a **fixed-size box**. Sizing scales with **both width and height** (see [Responsive sizing](#responsive-sizing)). If content is too tall to fit (e.g. a long wrapped value at a small height), it is **clipped**, not overflowed — the card will not grow past the height you gave it. |

```jsx
// Auto-height: card grows to fit content, whatever that content turns out to be
<AnedyaCard node={node} variable="humidity" />

// Fixed-height: card is exactly 300px tall; content that doesn't fit is clipped
<AnedyaCard node={node} variable="humidity" height={300} width={700} />
```

If you're using a `formatValue` that can produce long strings, either don't pass a fixed `height` (let the card grow to fit), or pass a `height` generous enough for the wrapped text at your chosen `width`.

#### AnedyaGauge

```jsx
<AnedyaGauge width={280} height={200} />
<AnedyaGauge size={220} />   // shorthand: sets width AND height to the same value (a square gauge)
```

`size` takes priority over `width`/`height` when both are set. Without `size` or `height`, the gauge fills its container's width and derives a proportional height automatically (unless `aspectRatio` is set).

| Prop          | Type     | Description                                                             |
| ------------- | -------- | -------------------------------------------------------------------------- |
| `size`        | `number` | Shorthand for equal `width`/`height` — a fixed square gauge                |
| `width`       | `number` | Container width in px                                                      |
| `height`      | `number` | Container height in px                                                     |
| `minWidth`    | `number` | Minimum container width in px                                              |
| `maxWidth`    | `number` | Maximum container width in px                                              |
| `minHeight`   | `number` | Minimum container height in px                                             |
| `maxHeight`   | `number` | Maximum container height in px                                             |
| `aspectRatio` | `number` | Width-to-height ratio used when neither `size` nor `height` is set         |

Unlike Card, the gauge doesn't clip content past a fixed `height` — instead, the arc's radius and internal spacing shrink to fit whatever box is available (see [Responsive sizing](#responsive-sizing) below).

---

### Responsive sizing

The widget automatically scales its internal spacing and typography using **CSS Container Queries** — based on the widget's own rendered size, not the browser viewport.

By default the following properties scale automatically:

- container padding
- title font size
- value font size
- unit font size
- label font size
- spacing (`gap`)
- arc thickness (gauge bar thickness)

**When `height` is omitted**, scaling responds to the container's **width only** (`cqw`).

**When `height` is passed**, scaling responds to **both width and height** (`cqw` + `cqh`) — a taller fixed-size container renders bigger text/gaps than a shorter one at the same width, in addition to width's usual effect. For the `AnedyaGauge`, the arc radius and thickness are also computed from the available container size, so they resize automatically.

A widget inside a narrow dashboard column will use smaller typography than the same widget rendered full-width, even on the same screen — this behavior is built in and needs no configuration.

#### Overriding responsive sizing

If you provide your own font-size utility for a slot, you're opting out of the default responsive sizing for that slot.

```tsx
// AnedyaCard
<AnedyaCard
  styles={{
    value: "text-6xl",
  }}
/>

// AnedyaGauge
<AnedyaGauge
  styles={{
    value: "text-6xl",
  }}
/>
```

The value will always render at `text-6xl`. Likewise, responsive Tailwind classes (`text-2xl md:text-5xl`) take precedence over the widget's default responsive sizing — your classes always win over the widget defaults.

> **AnedyaGauge note:** the arc's radius itself is handled separately from these CSS variables (it's a geometry calculation, not a font size) — it auto-fits to whatever space is left after padding and, if enabled, tick-mark space is subtracted, capped by `arc.radius` when you set one explicitly.

---

### Loading & error states

#### AnedyaCard

While the initial fetch is in flight, the card renders **skeleton loaders** in place of the value and label — pulsing placeholder blocks sized to match each slot's current font-size variable (`var(--anedya-card-value-size)` / `var(--anedya-card-label-size)`), so the skeleton scales along with the card exactly like the real content would.

If the fetch fails or no data is available, the card renders the error message text in place of the value (title still renders normally).

Neither state currently accepts style overrides via `styles` — flag it if you need to customize their appearance.

#### AnedyaGauge

While the initial fetch is in flight, the gauge renders the same kind of pulsing skeleton blocks in place of the value and label (sized against `var(--anedya-gauge-value-size)` / `var(--anedya-gauge-label-size)`), and the arc/needle themselves render at reduced opacity rather than disappearing, so the gauge's shape stays visible while data loads.

If the fetch fails or no data is available, the error message (or `renderError`/`renderEmpty` output) replaces the value/label block; the arc still renders behind it at the gauge's minimum value.

---

### Other props

#### AnedyaCard

| Prop            | Type     | Description                                                                        |
| --------------- | -------- | ------------------------------------------------------------------------------------ |
| `title`         | `string` | Card title. Default: `"Latest Value"`                                                |
| `value`         | `number` | Manual/controlled value. Used as the initial value, or the only value if no `node` is given |
| `unit`          | `string` | Unit suffix shown next to the value                                                  |
| `decimalPlaces` | `number` | Decimal places for the displayed value (used only if `formatValue` isn't provided)   |

#### AnedyaGauge

| Prop            | Type      | Description                                                                                    |
| --------------- | --------- | -------------------------------------------------------------------------------------------------- |
| `title`         | `string`  | Gauge title. Default: `"Latest Value"`                                                              |
| `value`         | `number`  | Manual/controlled value. Used as the initial value, or the only value if no `node` is given         |
| `min`           | `number`  | Minimum of the gauge's range. Default: `0`                                                          |
| `max`           | `number`  | Maximum of the gauge's range. Default: `100`                                                        |
| `unit`          | `string`  | Unit suffix shown next to the value                                                                 |
| `decimalPlaces` | `number`  | Decimal places for the displayed value (used only if `formatValue` isn't provided)                  |

---

## Stylesheet import

This SDK ships pre-compiled CSS alongside its JavaScript — you don't need Tailwind configured in your own project for these widgets to render correctly, even if you don't use Tailwind at all.

**Import the stylesheet once**, anywhere in your app's entry point (e.g. `main.tsx`, `App.tsx`, or your global styles file):

```jsx
import "@anedyasystems/anedya-widgets-react/styles.css";
```

That's the entire integration on your end. No `content` glob changes to your `tailwind.config`, no build coordination, nothing else required — every widget in this SDK will render fully styled as soon as this import is present.

> **If styles aren't appearing:** double-check the import path matches your installed package name exactly, and that it's imported somewhere that actually runs before your widgets render (e.g. not inside a conditionally-loaded file). If you're using a bundler with strict CSS module resolution, confirm it supports subpath imports from `node_modules` (most modern bundlers — Vite, Webpack 5+, Next.js — do, out of the box).