# CardWidget

A single-value display widget for Anedya data — shows the latest reading, a title, and a last-updated label.

## Setup

The widget doesn't create its own SDK client or node — you create both yourself and pass the node in:

```jsx
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "your-sdk";

const anedya = new Anedya();
const config = anedya.newConfig(tokenId, token);
const client = anedya.newClient(config);
const node = anedya.newNode(client, nodeId);

<CardWidget node={node} variable="humidity" />
```

## Required props

| Prop | Type | Description |
|---|---|---|
| `node` | `any` | `anedya.newNode(client, nodeId)` |
| `variable` | `string` | Variable name to display |

## The styling model

Unlike `ChartWidget` (which uses inline `style` objects), `CardWidget` is **entirely class-based** — every visual choice is a CSS class string, not a style property. This is deliberate: Card widgets are commonly styled with Tailwind, and classes compose and override far more predictably than inline styles do once you're combining a theme, a per-instance override, and a conditional rule all on the same element.

Every part of the card is a named **slot**:

```ts
type CardSlot = "container" | "title" | "value" | "unit" | "label";
```

## `classNames` vs `className` — the distinction that matters most

These look similar but do genuinely different things:

| | Shape | Targets | Purpose |
|---|---|---|---|
| `classNames` | object, keyed by slot | any inner slot (`title`, `value`, `unit`, `label`) *and* `container` | reach inside the widget |
| `className` | plain string | only the outermost container element | the ordinary React convention every component supports |

```jsx
<CardWidget
  className="shadow-lg"                 // outer box only
  classNames={{
    value: "text-red-500 text-5xl",     // the "value" slot specifically
    title: "uppercase tracking-wider",  // the "title" slot specifically
  }}
/>
```

Both can be used together freely — `className` is merged (via `twMerge`) with whatever `classNames.container` already resolved to; it doesn't replace it.

## Theming

`theme` accepts a built-in preset name, or a full custom `WidgetTheme<CardSlot>` object — just a plain object shaped like `classNames`, reusable across every widget instance that uses it:

```jsx
const emeraldTheme: WidgetTheme<CardSlot> = {
  classNames: {
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

## Tailwind responsive utilities

You can freely use Tailwind's responsive prefixes inside `classNames`:

```tsx
<CardWidget
  classNames={{
    value: "text-2xl md:text-4xl xl:text-6xl"
  }}
/>
```

These breakpoints come entirely from your application's Tailwind configuration and respond to the browser viewport.

They are independent of the widget's built-in container-query sizing.

If you supply your own `text-*` classes (responsive or otherwise), they replace the widget's default responsive typography for that slot.

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
        classNames: {
          value: "text-red-500",
        },
      };
    }
  }}
/>
```

Returning `undefined` (or nothing) clears any previous overrides and restores the widget's original props.

## How props are resolved

Rendering happens in layers.

1. The props you pass to `<CardWidget />`
2. Any temporary overrides returned from `onDataChange`
3. Theme resolution (`"light"`, `"dark"`, or a custom `WidgetTheme`)
4. Per-slot class resolution

For each slot (`container`, `title`, `value`, `unit`, `label`), classes are merged in this order:

1. `CARD_DEFAULT_CLASSES`
2. Active theme classes
3. `classNames`

Later layers win whenever two Tailwind utilities conflict. Conflicts are resolved with `twMerge`.

`className` is separate from this chain—it is merged onto the outer container after the container slot has been resolved.

> **Rule of thumb:** defaults → theme → `classNames` → `onDataChange`. User overrides always win.

## Formatting vs rendering

`formatValue` and `labelText` control **what text is displayed**.

`classNames` controls **how the widget looks**.

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
        classNames: {
          value: "text-red-500",
        },
      };
    }
  }}
/>
```

## Sizing

`width`/`height`/`minWidth`/`maxWidth` are plain props, applied as inline styles on the container — independent of the whole classNames/theme system, same convention as `ChartWidget`:

```jsx
<CardWidget width={320} height={200} minWidth={280} maxWidth={400} />
```
## Responsive sizing

The widget automatically scales its internal spacing and typography based on the size of the card itself using **CSS Container Queries**.

By default the following properties scale automatically:

- container padding
- title font size
- value font size
- unit font size
- label font size
- spacing (`gap`)

Unlike Tailwind's `sm:`/`md:` responsive utilities (which respond to the browser viewport), container queries respond to the widget's own rendered width.

For example, a card inside a narrow dashboard column will use smaller typography than the same card rendered full-width, even on the same screen.

This behavior is built in—you don't need to configure anything.

### Overriding responsive sizing

If you provide your own font-size utility for a slot, you're opting out of the default responsive sizing for that slot.

For example:

```tsx
<CardWidget
  classNames={{
    value: "text-6xl"
  }}
/>
```

The value will always render at `text-6xl`.

Likewise, if you provide responsive Tailwind classes:

```tsx
classNames={{
  value: "text-2xl md:text-5xl"
}}
```

your own breakpoint rules take precedence over the widget's default responsive sizing.

This follows normal Tailwind behavior—your classes always win over the widget defaults.

## Other props

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Card title. Default: `"Latest Value"` |
| `unit` | `string` | Unit suffix shown next to the value |
| `precision` | `number` | Decimal places for the displayed value (used only if `formatValue` isn't provided) |

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

Run it as part of your normal publish/build step (e.g. chain it into `prepublishOnly` or your existing `build` script) so `dist/style.css` always reflects the current source.

**4. Consumers import it once**, anywhere in their app:

```jsx
import "your-sdk/dist/style.css";
```

That's the entire integration on their end — no `content` glob changes, no Tailwind config coordination, no knowledge of how this SDK is built internally required.



- `style` (a plain inline-style object, part of the shared base props every widget accepts) isn't currently wired into the container's render — only `className` is. If you need it, flag it and it can be added the same way `className` already works.
