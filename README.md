# ChartWidget

A responsive, themeable line chart widget for Anedya data, built on D3 + SVG.

## Setup

The widget doesn't create its own SDK client — you create it yourself and pass it in:

```jsx
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { ChartWidget } from "your-sdk";

const anedya = new Anedya();
const config = anedya.newConfig(tokenId, token);
const client = anedya.newClient(config);

<ChartWidget
  anedya={anedya} // remove
  client={client}
  nodeId={nodeId}
  variable="humidity"
  from={twentyFourHoursAgo}
  to={currentTime}
/>
```

`anedya` and `client` are both required — node creation is `anedya.newNode(client, nodeId)`, a method on the top-level SDK instance, not on the client.

## Required props

| Prop | Type | Description |
|---|---|---|
| `anedya` | `any` | The `new Anedya()` instance |
| `client` | `any` | `anedya.newClient(config)` |
| `nodeId` | `string` | Node to fetch from |
| `variable` | `string` | Variable name to chart |
| `from` | `number` | Start timestamp (ms) |
| `to` | `number` | End timestamp (ms) |

## The styling model

Every stylable part of the chart is a named slot, and every value inside it is **plain CSS** — the same properties you'd use in any inline `style` object. Nothing invented, nothing to memorize:

```ts
interface ChartElementStyles {
  container?: React.CSSProperties;  // outer card — border, backgroundColor, width, etc.
  title?: React.CSSProperties;
  line?: React.CSSProperties;       // stroke, strokeWidth
  area?: React.CSSProperties;       // fill — base color for the gradient under the line
  dot?: React.CSSProperties & { r?: number }; // fill for color; r for radius (the one non-CSS exception)
  axis?: React.CSSProperties;       // stroke
  tick?: React.CSSProperties;       // fill, fontSize
}
```

These are spread directly onto the corresponding SVG elements (`<path style={{ fill: "none", ...resolved.line }} />`, etc.) — all standard SVG presentation properties (`fill`, `stroke`, `strokeWidth`, `fontSize`, `opacity`, ...) work as real CSS in every modern browser, so there's no translation layer.

**One exception:** `dot.r` (circle radius) is a plain number, not a CSS property — SVG geometry attributes like radius aren't stylable via CSS, only settable directly on the element.

## The `styles` prop — everything in one place

There's a single `styles` prop. It optionally accepts three *kinds* of keys, all in the same object:
// class definition 
```jsx
<ChartWidget
  styles={{
    // 1. FLAT keys — apply unconditionally, at every theme and size
    line: { stroke: "#7c3aed", strokeWidth: 3 },

    // 2. THEME keys ("light" / "dark") — only apply when that theme is active
    dark: { container: { backgroundColor: "#111827" } },

    // 3. BREAKPOINT keys ("sm" / "md" / "lg" / "xl") — only apply once the
    //    widget's own measured width crosses that threshold
    sm: { tick: { fontSize: 8 } },
    lg: { tick: { fontSize: 12 } },
  }}
/>
```

`styles` can also be a function of the widget's current state, if styling needs to depend on load/error status rather than just data:

```jsx
styles={(state) => (state.error ? { container: { border: "1px solid red" } } : {})}
```

### Theme defaults

```jsx
<ChartWidget theme="dark" />   // or "light" (default)
```

`lightTheme` and `darkTheme` (exported from the package) are just `ChartElementStyles` objects with sensible default colors — nothing special about them. Setting `theme` picks which one seeds the chart.

### Breakpoints

Breakpoints are measured against the **widget's own rendered width** via `ResizeObserver` — container-query semantics, not the browser window. This means the chart responds correctly no matter where it's embedded (a sidebar, a dashboard tile, a modal), regardless of how wide the actual browser window is.
//take definitrion from user for breakpoints 
| Breakpoint | Min width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

Resolution is mobile-first: each breakpoint the container has reached merges on top of smaller ones, same as Tailwind's `sm:`/`md:`/`lg:`/`xl:` prefixes.

## Sizing — the same system, not a separate one

`width`, `minWidth`, `maxWidth`, `height`, `minHeight`, `maxHeight` are just CSS properties living on `container`. That means sizing goes through the *exact same* flat → theme → breakpoint pipeline as everything else — which is what makes the following four cases fall out naturally, with no special-case logic:

```jsx
// Fully fixed — no breakpoint overrides anywhere, so it never changes
<ChartWidget width={500} height={300} />

// Fixed by default, but steps to a new size at a breakpoint (opt-in responsiveness)
<ChartWidget
  width={500}
  styles={{ lg: { container: { width: 900 } } }}
/>

// Fluid — continuously follows the container, clamped between bounds
<ChartWidget minWidth={300} maxWidth={900} />

// Fluid, where the clamp bounds themselves step at a breakpoint
<ChartWidget
  minWidth={280} maxWidth={600}
  styles={{ lg: { container: { minWidth: 600, maxWidth: 1200 } } }}
/>

// Nothing passed at all — fully responsive with built-in defaults
// (clamped between 280–1200px wide, 200–700px tall)
<ChartWidget />
```

The `width`/`height`/`minWidth`/`maxWidth`/`minHeight`/`maxHeight` **props** are shorthand for setting these same properties unconditionally on `styles.container` — if you also set them explicitly inside `styles`, the `styles` value wins.

If the container ever gets smaller than the resolved `minWidth`, the chart doesn't get crushed — the outer wrapper scrolls horizontally (`overflowX: auto`) instead of squishing the content.

## Callbacks — data-driven styling

For simple "if a threshold is crossed, change the styling" logic, pass `styleRules` directly — no wrapping function needed, the widget evaluates it internally against the latest data point:
//update this 
```jsx
<ChartWidget
  styleRules={[
    { when: (d) => d.value > 80, style: { line: { stroke: "#dc2626" } } },
    { when: (d) => d.value < 20, style: { line: { stroke: "#2563eb" } } },
  ]}
/>
```

If multiple rules match, their styles merge in array order (later rules win on overlapping keys), so rules can stack — e.g. a broad "warning" rule plus a narrower "critical" rule.

For anything beyond simple threshold matching, `onStyleChange` runs whenever the fetched data changes and returns a `ChartElementStyles` object (the same flat shape as `styles`) for full custom logic:

```jsx
<ChartWidget
  onStyleChange={(data) => {
    const latest = data[data.length - 1];
    const avg = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    return latest?.value > avg * 1.5 ? { line: { stroke: "#dc2626" } } : {};
  }}
/>
```

If both `styleRules` and `onStyleChange` are used together, `styleRules` resolves first and `onStyleChange` applies on top — so custom logic can still override a rule if needed.

## Full resolution order

Low to high precedence — later layers win on any overlapping property:

1. **Theme preset** (`lightTheme` / `darkTheme`)
2. **Sizing shorthand props** (`width`, `minWidth`, etc.)
3. **`styles`' flat keys**
4. **`styles`' active theme key** (`styles.light` or `styles.dark`)
5. **`styles`' active breakpoint keys** (mobile-first cascade)
6. **`styleRules` + `onStyleChange` result** — always wins, since it's live and data-driven (`styleRules` resolves first, `onStyleChange` on top)

## Other props

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Chart title. Default: `"Latest Data"` |
| `limit` | `number` | Max data points fetched. Default: `20` |
| `tickCount` | `number` | X-axis tick count (auto-reduced on narrow containers) |
| `xTickFormat` / `yTickFormat` | `string \| function` | Custom tick label formatting |
| `tooltipFormat` | `(point) => React.ReactNode` | Custom tooltip content — can return a string or rich JSX | 
| `aspectRatio` | `number` | Width-to-height ratio used to derive height when no fixed/resolved height is set. Default: `1.6` |

## Known follow-ups

- Tooltips currently use Base UI (`@base-ui/react/tooltip`); a swap to a D3-based tooltip is planned separately.
- Axis styling currently supports a single stroke color/width, not per-axis-segment overrides.
- No dot-decimation yet on very narrow/dense containers (many points can visually overlap).

