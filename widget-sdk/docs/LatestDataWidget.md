🧩 LatestDataWidget

Displays the latest sensor or node data from an Anedya network node.
Ideal for dashboards that show real-time or near-real-time values (like temperature, pressure, humidity, etc.).

🚀 Usage Example

```import { initAnedyaClient } from "../utils/anedyaClient";
import { LatestDataWidget } from "../components/LatestDataWidget";

const client = initAnedyaClient("TOKEN_ID", "TOKEN");

function App() {
return (
<LatestDataWidget
client={client}
nodeId="NODE123"
variable="temperature"
title="Temperature"
unit="°C"
colorRangeCallback={(val, def) => {
if (val < 15) return "#3498db";
if (val < 30) return "#2ecc71";
return "#e74c3c";
}}
styles={{
container: { width: 220, height: 220, bgcolor: "#fafafa" },
value: { fontWeight: 800 },
}}
/>
);
}```

⚙️ Props

| **Prop**           | **Type**                                        | **Required** | **Description**                                                            |
|--------------------|-------------------------------------------------|:------------:|----------------------------------------------------------------------------|
| client             | AnedyaClient                                    |       ✅      | An initialized Anedya client instance, created using  initAnedyaClient().  |
| nodeId             | string                                          |       ✅      | ID of the node whose latest data is to be fetched                          |
| variable           | string                                          |       ✅      | The variable name (key) to fetch from the node’s data.                     |
| title              | string                                          |       ❌       | Optional label displayed above the value.                                  |
| unit               | string                                          |       ❌      | Unit of measurement shown after the value.                                 |
| styles             | StyleSet                                        |       ❌      | Custom style overrides for container, label, value, and unit.              |
| colorRange         | typeof defaultColorRanges                       |       ❌      | Optional custom color range configuration.                                 |
| colorRangeCallback | (value: number, defaultColor: string) => string |       ❌     | Callback that lets you overrride the computed color logic for data values. |
| fontFamily         | string                                          |       ❌      | Global font family applied to all text (defaults to  "Roboto").            |

🎨 Styling

The styles prop allows fine-grained control over the look and feel of the widget.

StyleSet Interface

```ts
interface StyleSet {
container?: SxProps<Theme>;
label?: SxProps<Theme>;
value?: SxProps<Theme>;
unit?: SxProps<Theme>;
fontFamily?: string; // Optional global font for all texts
}
```

Default Styles

```ts
const defaultStyles = {
container: {
bgcolor: "#f4f4f4",
borderRadius: 2,
p: 2,
display: "flex",
flexDirection: "column",
justifyContent: "center",
alignItems: "center",
textAlign: "center",
width: 200,
height: 200,
gap: 10,
},
label: { fontWeight: 500, color: "#666" },
value: { fontWeight: 700, color: "#333" },
unit: { fontWeight: 400, color: "#888" },
};
```

You can override any of these:

```tsx
<LatestDataWidget
styles={{
container: { bgcolor: "#fff3cd", width: 250, height: 250 },
value: { color: "#ff9900", fontSize: 32 },
}}
/>
```

🎨 Color Customization

Use colorRangeCallback to apply dynamic colors based on value:

```tsx
colorRangeCallback={(val, def) => {
if (val < 30) return "#2ecc71"; // green
if (val < 70) return "#f1c40f"; // yellow
if (val <= 100) return "#e74c3c"; // red
return def;
}}
```

You can also provide your own static colorRange set if you want total control.

🧠 Logic & Behavior

-Auto font scaling based on container width/height (if no explicit font size provided).

-Global fontFamily can be overridden per text type (label, value, unit).

-Gap scaling: If no gap provided in container style, it scales dynamically with font size.

-Rate limiter: Prevents rapid API re-fetches and protects backend.

-Circuit breaker: Temporarily halts fetches after repeated failures.

-Infinite render protection: Detects excessive re-renders in parent component.

-Safe mount/unmount: Prevents API updates after unmount or component change.

