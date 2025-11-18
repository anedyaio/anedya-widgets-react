🧩 ChartWidget

Displays the historical time-series data for a given variable from an Anedya network node.
Ideal for dashboards that show real-time or near-real-time values (like temperature, pressure, humidity, etc.).

🚀 Usage Example

```import { initAnedyaClient } from "widget-sdk";
import { ChartWidget } from "widget-sdk";

const client = initAnedyaClient("TOKEN_ID", "TOKEN");

function App() {
return (
<ChartWidget
 client={client}
  nodeId={nodeId}
  variable="temperature"
  title="Temperature Trend"
  styles={{
    container: {
      width: 450,
      height: 300,
     background: "linear-gradient(to right, #cfcfdeff, #5b5b61ff)",
      borderRadius: 6,
      p: 2,
    },
    title: { color: "#fff", fontSize: "18px" },
    chart: {
      strokeColor: "rgba(0, 143, 251, 0.85)",
      strokeWidth: 3,
      gradientColors:["rgba(0, 143, 251, 0.85)", "#ffe0b2"],
    },
    tooltip: {
     background: "rgba(0,0,0,0.75)",
      color: "#fff",
      fontSize: "13px",
    },
  }}
  tooltipFormatter={(d) =>
    `${new Date(d.timestamp).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}: ${d.value}°C`
  }

  tickFormatter={(date) =>
        date.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      }

      tickFrequency={4}  // default is auto
/>
);
}```

🎚 Tick Configuration

```tickFormatter?: (date: Date) => string;
tickFrequency?: number;   // how many ticks you want (default: auto)
```
📡 Tooltip Formatting
```tooltipFormatter?: (point: { timestamp: number; value: number }) => string;
```

⚙️ Props

| **Prop**           | **Type**                                        | **Required** | **Description**                                                            |
|--------------------|-------------------------------------------------|:------------:|----------------------------------------------------------------------------|
| client             | AnedyaClient                                    |       ✅      | An initialized Anedya client instance, created using  initAnedyaClient().  |
| nodeId             | string                                          |       ✅      | ID of the node whose latest data is to be fetched                          |
| variable           | string                                          |       ✅      | The variable name (key) to fetch from the node’s data.                     |
| title              | string                                          |       ❌       | Optional label displayed above the value.                                  |
| unit               | string                                          |       ❌      | Unit of measurement shown after the value.                                 |
| styles             | StyleSet                                        |       ❌      | Custom style overrides for container, label, value, and unit.              |
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
<ChartWidget
styles={{
container: { bgcolor: "#fff3cd", width: 250, height: 250 },
value: { color: "#ff9900", fontSize: 32 },
}}
/>
```
