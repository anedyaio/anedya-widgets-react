 🧩 LatestDataWidget

Displays the latest data from an Anedya node.
Ideal for dashboards that show latest values (like temperature, pressure, humidity, etc.).

🚀 Usage Example

```
import { initAnedyaClient } from "../utils/anedyaClient";
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
}
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
| colorRange         | typeof defaultColorRanges                       |       ❌      | Optional custom color range configuration.                                 |
| colorRangeCallback | (value: number, defaultColor: string) => string |       ❌     | Callback that lets you overrride the computed color logic for data values. |
| fontFamily         | string                                          |       ❌      | Global font family applied to all text (defaults to  "Roboto").            |

🎨 Styling

The styles prop allows fine-grained control over the look and feel of the widget.

StyleSet Interface

```
interface StyleSet {
container?: SxProps<Theme>;
label?: SxProps<Theme>;
value?: SxProps<Theme>;
unit?: SxProps<Theme>;
fontFamily?: string; // Optional global font for all texts
}
```

Default Styles

```
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

```
<LatestDataWidget
styles={{
container: { bgcolor: "#fff3cd", width: 250, height: 250 },
value: { color: "#ff9900", fontSize: 32 },
}}
/>
```

🎨 Color Customization

Use colorRangeCallback to apply dynamic colors based on value:

```
colorRangeCallback={(val, def) => {
if (val < 30) return "#2ecc71"; // green
if (val < 70) return "#f1c40f"; // yellow
if (val <= 100) return "#e74c3c"; // red
return def;
}}
```

You can also provide your own static colorRange set if you want total control.

📌 LatestData Widget — Callback Options

The LatestData widget supports two optional callbacks that allow you to fully customize how the displayed value and styling behave.

## 1. displayText Callback (Value + Unit Formatter)

The displayText callback lets you customize:

- how the value is displayed

- what unit text should look like

-  here the unit is placed

- unit formatting style (normal, subscript, superscript)

### What This Callback Looks Like

```
displayText?: (value: number, unit: string) => {
  text: string;
  unitText?: string;
  position?: "left" | "right" | "top" | "bottom";
  unitStyle?: "normal" | "subscript" | "superscript";
};
```

### Usage Example
 ```
 <LatestData
  ...
  displayText={(value, unit) => ({
    text: `${value}`,
    unitText: unit,
    position: "right",           // left | right | top | bottom
    unitStyle: "normal",         // normal | subscript | superscript
  })}
/>
```

| Property      | Type |Description                                           |
| ------------- | ------------------------------------------ | ----------------------------------------------------- |
| **text**      | `string`                                   | The formatted value to display                        |
| **unitText**  | `string`                                   | Custom unit text (optional)                           |
| **position**  | `"left" \| "right" \| "top" \| "bottom"`   | Where the unit should be placed relative to the value |
| **unitStyle** | `"normal" \| "subscript" \| "superscript"` | Choose how the unit should appear                     |


### Examples
#### Move unit to the top
```
displayText={() => ({ text: "25.3", unitText: "°C", position: "top" })}
```

#### Show unit as subscript

```
displayText={(value) => ({
  text: value.toFixed(1),
  unitText: "ppm",
  unitStyle: "subscript",
})}
```
## 2. onStyleChange Callback (Dynamic Styling)

This callback lets you override widget styling based on live value updates.

It receives the current numeric value and should return partial styles, which will override the base styles.

### What This Callback Looks Like 

```
onStyleChange?: (value: number) => Partial<LatestDataStyles>;
```
### Usage Example

```
<LatestData
  ...
  onStyleChange={(value) => {
    if (value > 80) {
      return {
        value: { color: "red", fontWeight: 700 },
        unit: { color: "red" },
      };
    }

    return {}; // keep original styling
  }}
/>
```
### What you can style dynamically

You may return overrides for:

| Key          | Description                 |
| ------------ | --------------------------- |
| `container`  | Outer wrapper styles        |
| `label`      | Title text styles           |
| `value`      | Value text styles           |
| `unit`       | Unit text styles            |
| `fontFamily` | Override global font family |

Example returning multiple overrides:
 ```
 return {
  container: { background: "#ffeeee" },
  value: { color: "#d60000", fontSize: "90px" },
};
```


 🧩 Latest Data Guage

Displays the latest sensor or node data from an Anedya network node in a guage


🚀 Usage Example

```import { initAnedyaClient } from "../utils/anedyaClient";
import { LatestDataGauge } from "../components/LatestDataWidget";

const client = initAnedyaClient("TOKEN_ID", "TOKEN");

function App() {
return (
     <LatestDataGauge
          client={client}
          nodeId={nodeId}
          variable="temperature"
          title="Temperature Sensor"
          unit={"°C"}
    
          showNeedle={false}
          styles={{
            container: {
              width: 350,
              height: 200,
              background:
                "linear-gradient(to right, rgb(47, 99, 255), rgb(20, 110, 180))",
              borderRadius: 10,
              gap: 1,
            },
            label: { fontWeight: 500, color: "#ffffff", fontSize: "20px" },
            value: { fontWeight: 700, fontSize: "30px", color: "#ffffff" },
            unit: { fontWeight: 400, color: "#ffffff", fontSize: "30px" },
            fontFamily: "Arial, sans-serif", // global font
          }}

            onStyleChange={(value) => {
              if (value > 80) {
                return {
                  value: { color: "black" },
                  label: { color: "orange" },
                };
              }

              return {}; // keep original styling
            }}
        />
);
}
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
| colorRange         | typeof defaultColorRanges                       |       ❌      | Optional custom color range configuration.                                 |
| fontFamily         | string                                          |       ❌      | Global font family applied to all text (defaults to  "Roboto").            |


📌 Latest Data Gauge Widget — Callback Options

## 1. onStyleChange Callback (Dynamic Styling)

This callback lets you override widget styling based on live value updates.

It receives the current numeric value and should return partial styles, which will override the base styles.

### What This Callback Looks Like 

```
onStyleChange?: (value: number) => Partial<LatestDataSGuageStyles>;
```
### Usage Example

```
<LatestDataGauge
  ...
  onStyleChange={(value) => {
    if (value > 80) {
      return {
        value: { color: "red", fontWeight: 700 },
        unit: { color: "red" },
      };
    }

    return {}; // keep original styling
  }}
/>
```
### What you can style dynamically

You may return overrides for:

| Key          | Description                 |
| ------------ | --------------------------- |
| `container`  | Outer wrapper styles        |
| `label`      | Title text styles           |
| `value`      | Value text styles           |
| `unit`       | Unit text styles            |
| `fontFamily` | Override global font family |

Example returning multiple overrides:
 ```
 return {
  container: { background: "#ffeeee" },
  value: { color: "#d60000", fontSize: "90px" },
};
```


🧩 Chart Widget

Displays the historical time-series data for a given variable in chart form


🚀 Usage Example

```import { initAnedyaClient } from "../utils/anedyaClient";
import { ChartWidget } from "../components/LatestDataWidget";

const client = initAnedyaClient("TOKEN_ID", "TOKEN");

function App() {
return (
       <ChartWidget
            client={client}
            nodeId={nodeId}
            variable="humidity"
            title="Humidity Trend"
            styles={{
              container: {
                width: 450,
                height: 300,
                //rgb(248, 249, 250)
                background: "rgb(248, 249, 250)",
                borderRadius: 6,
                border: "1px solid rgba(211, 216, 220, 1)",
                padding: 10,
              },
              title: { color: "#000000", fontSize: "18px" },
              chart: {
                strokeColor: "rgba(0, 143, 251, 0.85)",
                strokeWidth: 3,
                gradientColors: ["rgba(0, 143, 251, 0.85)", "#ffe0b2"],
              },
              tooltip: {
                backgroundColor: "rgba(0,0,0,0.75)",
                color: "#fff",
                fontSize: "13px",
              },
            }}
            tickCount={5}
              xTickFormat={(d) => d.toLocaleDateString()}
            yTickFormat={(v) => `${v} °C`}
            tooltipFormat={(d, unit) =>
              `${new Date(d.timestamp * 1000)} : ${d.value} Celsius`
            }
            onStyleChange={(data) => {
              return {
                title: { color: "red" },
                container: {
                  background: "rgba(232, 236, 240, 1)",
                  borderRadius: 10,
                },
              };
            }}
          />
);
}
```

⚙️ Props

| **Prop**           | **Type**                                        | **Required** | **Description**                                                            |
|--------------------|-------------------------------------------------|:------------:|----------------------------------------------------------------------------|
| client             | AnedyaClient                                    |       ✅      | An initialized Anedya client instance, created using  initAnedyaClient().  |
| nodeId             | string                                          |       ✅      | ID of the node whose latest data is to be fetched                          |
| variable           | string                                          |       ✅      | The variable name (key) to fetch from the node’s data.       
| from               | number                                          |       ✅      |  earliest timestamp or date from which data should be fetched, in milliseconds epoch  
| to                 | number                                          |       ✅      |  latest timestamp or date from which data should be fetched, in milliseconds epoch        
| title              | string                                          |       ❌      | Optional label displayed above the value.                
| fontFamily         | string                                          |       ❌      | Global font family applied to all text (defaults to  "Roboto").            
| tickCount          | number                                          |       ❌      | # of X-axis ticks 
| tooltipFormatter   | `(p)=>string`                                   |       ❌      | Tooltip HTML (p is timestamp in seconds epoch)
| styles             | StyleSet                                        |       ❌      | Custom style overrides for container

📊 Chart Widget — Callback Options

The Chart widget allows you to customize tick labels, tooltip content, and dynamic runtime styles through several optional callbacks.

## 1. xTickFormat (Format X-Axis Labels)

Use this to control how X-axis values are displayed.

### What This Callback Looks Like

```
xTickFormat?: (value: number | Date | string) => string;

```

### Example
 ```
xTickFormat={(d) => d.toLocaleDateString()}

```

### Usage

- Format timestamps

- Turn raw numbers into readable labels

- Apply locale-based formats


## 2. yTickFormat (Format Y-Axis Labels)

Use this to format numeric Y-axis values.

### What This Callback Looks Like 

```
yTickFormat?: (value: number) => string;

```
### Example
 ```
yTickFormat={(v) => `${v} °C`}

```

### Usage

- Add units

- Round or scale numbers

- Convert to % or fixed decimals

## 3. tooltipFormat (Customize Tooltip Text)

This callback returns the content string used in tooltips when hovering on data points.

### What This Callback Looks Like 

``` 
tooltipFormat?: (dataPoint: ChartDataPoint, unit: string) => string;
```
Where ChartDataPoint is typically:

``` 
{
  timestamp: number;
  value: number;
}
```
### Example
 ```
tooltipFormat={(d, unit) =>
  `${new Date(d.timestamp * 1000)} : ${d.value} Celsius`
}
```

### Usage

- Format date/time for tooltips

- Add units, custom labels, or metadata

- Show multi-line tooltip content

## 4. onStyleChange (Dynamic Chart Styling)
This callback allows dynamic runtime style overrides based on the current chart data.

### What This Callback Looks Like
```
onStyleChange?: (data: ChartDataPoint[]) => Partial<ChartStyleSet>;
```
You can return overrides for any part of the chart:

| Key          | Description                       |
| ------------ | --------------------------------- |
| `container`  | Wrapper style                     |
| `title`      | Title text                        |
| `axis`       | Axis text & tick style            |
| `tooltip`    | Tooltip background, color, radius |
| `chart`      | Stroke, width, dot radius         |
| `fontFamily` | Global font override              |

### Example

```
onStyleChange={(data) => {
  return {
    title: { color: "red" },
    container: {
      background: "rgba(232, 236, 240, 1)",
      borderRadius: 10,
    },
  };
}}
```

### Use cases
- Highlight chart when values exceed thresholds

- Change themes based on the data

- Dim colors when dataset is small

- Respond to live-updating data streams