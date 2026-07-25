[<img alt="PyPI" src="https://img.shields.io/npm/v/%40anedyasystems%2Fanedya-frontend-sdk?style=for-the-badge">](https://www.npmjs.com/package/@anedyasystems/anedya-frontend-sdk)&nbsp;&nbsp;[<img alt="Anedya Documentation" src="https://img.shields.io/badge/Anedya-Documentation-blue?style=for-the-badge">](https://docs.anedya.io?utm_source=github&utm_medium=link&utm_campaign=github-sdk&utm_content=js)

<!---<div style="width:20%; margin:0 auto;margin-bottom:50px;margin-top:50px;">-->
<p align="center">
    <img src="https://cdn.anedya.io/anedya_black_banner.png" alt="Logo">
</p>
<!--</div>-->

# Anedya Widgets SDK

A collection of pre-built, themeable React widgets for displaying Anedya IoT data — drop-in components for dashboards and front-end apps.

## Table of Contents

- [Installation & Setup](#installation--setup)
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

## Stylesheet import

This SDK ships pre-compiled CSS alongside its JavaScript — you don't need Tailwind configured in your own project for these widgets to render correctly, even if you don't use Tailwind at all.

**Import the stylesheet once**, anywhere in your app's entry point (e.g. `main.tsx`, `App.tsx`, or your global styles file):

```jsx
import "public-widget-sdk/styles.css";
```

That's the entire integration on your end. No `content` glob changes to your `tailwind.config`, no build coordination, nothing else required — every widget in this SDK will render fully styled as soon as this import is present.

> **If styles aren't appearing:** double-check the import path matches your installed package name exactly, and that it's imported somewhere that actually runs before your widgets render (e.g. not inside a conditionally-loaded file). If you're using a bundler with strict CSS module resolution, confirm it supports subpath imports from `node_modules` (most modern bundlers — Vite, Webpack 5+, Next.js — do, out of the box).
