# CardWidget

A single-value display widget for Anedya data — shows the latest reading, a title, and a last-updated label.

## Table of Contents

- [Setup](#setup)
- [Required props](#required-props)
- [The styling model](#the-styling-model)
- [`styles` vs `className`](#styles-vs-classname--the-distinction-that-matters-most)
- [Theming](#theming)
- [Tailwind responsive utilities](#tailwind-responsive-utilities)
- [`onDataChange` — data-driven rendering](#ondatachange--data-driven-rendering)
- [How props are resolved](#how-props-are-resolved)
- [Formatting vs rendering](#formatting-vs-rendering)
- [Sizing](#sizing)
- [Responsive sizing](#responsive-sizing)
- [Loading & error states](#loading--error-states)
- [Other props](#other-props)
- [Build & distribution](#build--distribution--why-classes-render-unstyled-without-this)

---
## Setup

`CardWidget` doesn't create its own SDK client or node — it only renders data you fetch through the [Anedya Frontend SDK](https://www.npmjs.com/package/@anedyasystems/anedya-frontend-sdk), which is a separate package you'll need alongside this one.

**1. Install both packages:**

```bash
npm install @anedyasystems/anedya-frontend-sdk your-sdk
```

**2. Create a client and node using the Frontend SDK, then pass the node into `CardWidget`:**

```jsx
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "your-sdk";

const anedya = new Anedya();
const config = anedya.newConfig(tokenId, token);
const client = anedya.newClient(config);
const node = anedya.newNode(client, nodeId);

<CardWidget node={node} variable="humidity" />
```

> `tokenId`, `token`, and `nodeId` come from your Anedya account/device setup — see the [Frontend SDK docs](https://www.npmjs.com/package/@anedyasystems/anedya-frontend-sdk) for details on obtaining these and on other `node`/`client` methods (fetching historical data, live streaming, key-value store, etc.) beyond what this widget itself uses.

---

## Required props

| Prop | Type | Description |
|---|---|---|
| `node` | `any` | `anedya.newNode(client, nodeId)` |
| `variable` | `string` | Variable name to display |

---

## The styling model

`CardWidget` is **entirely class-based** — every visual choice is a CSS class string, not a style property. This is deliberate: card widgets are commonly styled with Tailwind, and classes compose and override far more predictably than inline styles do once you're combining a theme, a per-instance override, and a conditional rule all on the same element.

Every part of the card is a named **slot**:

```ts
type CardSlot = "container" | "title" | "value" | "unit" | "label";
```

---

## `styles` vs `className` — the distinction that matters most

These look similar but do genuinely different things:

| | Shape | Targets | Purpose |
|---|---|---|---|
| `styles` | object, keyed by slot | any inner slot (`title`, `value`, `unit`, `label`) *and* `container` | reach inside the widget |
| `className` | plain string | only the outermost container element | the ordinary React convention every component supports |

```jsx
<CardWidget
  className="shadow-lg"                 // outer box only
  styles={{
    value: "text-red-500 text-5xl",     // the "value" slot specifically
    title: "uppercase tracking-wider",  // the "title" slot specifically
  }}
/>
```

Both can be used together freely — `className` is merged (via `twMerge`) with whatever `styles.container` already resolved to; it doesn't replace it.

> **Note:** `styles` classes are consumer-authored strings forwarded straight into `className` at render — the widget doesn't generate any CSS for them at build time. Any class you pass here must already exist in your own app's compiled CSS (e.g. your own Tailwind build, or a plain hand-written class in a stylesheet you import) — arbitrary utility names that only the widget's *own* Tailwind build knows about (like the container-query variables described below) won't do anything if typed fresh from a consuming app.

---

## Theming

`theme` accepts a built-in preset name, or a full custom `WidgetTheme<CardSlot>` object — just a plain object shaped like `styles`, reusable across every widget instance that uses it:

```jsx
const emeraldTheme: WidgetTheme<CardSlot> = {
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

## Tailwind responsive utilities

You can freely use Tailwind's responsive prefixes inside `styles`:

```tsx
<CardWidget
  styles={{
    value: "text-2xl md:text-4xl xl:text-6xl"
  }}
/>
```

These breakpoints come entirely from your application's Tailwind configuration and respond to the **browser viewport**. They are independent of the widget's built-in container-query sizing (see [Responsive sizing](#responsive-sizing) below).

If you supply your own `text-*` classes (responsive or otherwise), they replace the widget's default responsive typography for that slot.

---

## `onDataChange` — data-driven rendering

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

## How props are resolved

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

## Formatting vs rendering

`formatValue` and `labelText` control **what text is displayed**.

`styles` controls **how the widget looks**.

`onDataChange` can override either one (along with most other widget props), allowing the widget to react to incoming data.

For example:

```tsx
<CardWidget
  formatValue={(v) => `${v.toFixed(2)} % RH`}
  labelText={(ts) => `As of ${new Date(ts).toLocaleDateString()}`}
  onDataChange={(data) => {
    if (!data) return;

    if (data.value > 80) {
      return {
        title: "High Humidity",
        styles: {
          value: "text-red-500",
        },
      };
    }
  }}
/>
```

> Long `formatValue` output (e.g. `"56.00 % RH"`) may wrap onto a second line at small widths — the value slot wraps rather than overflowing. See [Sizing](#sizing) for how this interacts with a fixed `height`.

---

## Sizing

`width` / `height` / `minWidth` / `maxWidth` are plain props, applied as inline styles on the container — independent of the whole `styles`/theme system:

```jsx
<CardWidget width={320} height={200} minWidth={280} maxWidth={400} />
```

### `height` has two distinct modes

Whether you pass `height` changes how the card behaves — this is intentional, not a quirk:

| | Behavior |
|---|---|
| **`height` omitted** | The card **auto-grows** to fit its content. If `formatValue`/`labelText` produce long text that wraps, the card simply becomes taller. Sizing scales with **width only**. |
| **`height` passed** | The card becomes a **fixed-size box**. Sizing scales with **both width and height** (see [Responsive sizing](#responsive-sizing)). If content is too tall to fit (e.g. a long wrapped value at a small height), it is **clipped**, not overflowed — the card will not grow past the height you gave it. |

```jsx
// Auto-height: card grows to fit content, whatever that content turns out to be
<CardWidget node={node} variable="humidity" />

// Fixed-height: card is exactly 300px tall; content that doesn't fit is clipped
<CardWidget node={node} variable="humidity" height={300} width={700} />
```

If you're using a `formatValue` that can produce long strings, either don't pass a fixed `height` (let the card grow to fit), or pass a `height` generous enough for the wrapped text at your chosen `width`.

---

## Responsive sizing

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

### Overriding responsive sizing

If you provide your own font-size utility for a slot, you're opting out of the default responsive sizing for that slot.

For example:

```tsx
<CardWidget
  styles={{
    value: "text-6xl"
  }}
/>
```

The value will always render at `text-6xl`.

Likewise, if you provide responsive Tailwind classes:

```tsx
styles={{
  value: "text-2xl md:text-5xl"
}}
```

your own breakpoint rules take precedence over the widget's default responsive sizing. This follows normal Tailwind behavior — your classes always win over the widget defaults.

---

## Loading & error states

While the initial fetch is in flight, the card renders a small spinner in place of the value. If the fetch fails or no data is available, the card renders the error message text in place of the value (title and label still render normally). Neither state currently accepts style overrides via `styles` — flag it if you need to customize their appearance.

---

## Other props

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Card title. Default: `"Latest Value"` |
| `unit` | `string` | Unit suffix shown next to the value |
| `decimalPlaces` | `number` | Decimal places for the displayed value (used only if `formatValue` isn't provided) |

---

## Build & distribution — why classes render unstyled without this

Since this SDK is installed as a real package (not copied into the consumer's own repo, the way shadcn/ui works), the consumer's own Tailwind build **never scans this package's source files** by default — so every class string in `themes/defaultTheme.ts`/`CARD_DEFAULT_CLASSES` compiles to nothing in their app, and every widget renders with zero layout or color. This isn't a bug in the widget; it's a structural consequence of shipping Tailwind classes from an installable package.

**The fix: ship a pre-compiled stylesheet as part of this SDK's own build**, so consumers import real, already-compiled CSS rather than relying on their own Tailwind config to happen to pick up ours.

**1. Create the input file**, `src/styles/base.css`:

```css
@import "tailwindcss";

/* Explicit @source directives so Tailwind scans exactly the folders
   containing our class strings, rather than relying purely on
   automatic detection. Paths are relative to this file's location. */
@source "../widgets/**/*.{ts,tsx}";
@source "../themes/**/*.{ts,tsx}";
@source "../common.ts";
```

**2. Install the Tailwind v4 CLI** (a separate package from core `tailwindcss` as of v4):

```bash
npm install -D @tailwindcss/cli
```

**3. Add a build script**, in `package.json`:

```json
{
  "scripts": {
    "build:css": "tailwindcss -i ./src/styles/base.css -o ./dist/style.css --minify"
  }
}
```

Run it as part of your normal publish/build step so `dist/style.css` always reflects the current source.

**4. Consumers import it once**, anywhere in their app:

```jsx
import "your-sdk/dist/style.css";
```

That's the entire integration on their end — no `content` glob changes, no Tailwind config coordination, no knowledge of how this SDK is built internally required.

---

- `style` (a plain inline-style object, part of the shared base props every widget accepts) isn't currently wired into the container's render — only `className` is. If you need it, flag it and it can be added the same way `className` already works.