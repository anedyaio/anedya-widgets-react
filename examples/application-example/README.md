# Anedya Widgets Example

A minimal React application demonstrating how to use the **Anedya Widgets SDK** with the **Anedya Frontend SDK**.

This project shows how to authenticate with Anedya, create a client and node, and display live IoT data using the provided widgets. It also demonstrates rendering widgets with manually supplied values, making it a simple reference for integrating the SDK into your own dashboards and applications.

---

## Prerequisites

Before running the example, you'll need:

- Node.js 18 or later
- An Anedya account
- A valid **Token ID**
- A valid **Token**
- A **Node ID** for a device

---

## Installation

Clone the repository and install the project dependencies.

```bash
npm install
```

---

## Configuration

Open `src/App.tsx` and replace the placeholder credentials with your own:

```tsx
const tokenId = "YOUR_TOKEN_ID";
const token = "YOUR_TOKEN";
const nodeId = "YOUR_NODE_ID";
```

The example creates an Anedya client and node that are passed directly to the widgets:

```tsx
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";

const anedya = new Anedya();

const config = anedya.newConfig(tokenId, token);
const client = anedya.newClient(config);
const node = anedya.newNode(client, nodeId);
```

---

## Running the example

Start the development server:

```bash
npm run dev
```

Open the URL displayed in your terminal (typically `http://localhost:5173`).

---

# Using the widgets

## Live data

To display live values from Anedya, provide a `node` and `variable`.

### Card

```tsx
<AnedyaCard
  node={node}
  variable="humidity"
/>
```

### Gauge

```tsx
<AnedyaGauge
  node={node}
  variable="temperature"
/>
```

---

## Manual values

Widgets can also be rendered without connecting to Anedya by providing a `value`.

### Card

```tsx
<AnedyaCard
  value={65}
  title="Humidity"
  unit="%"
/>
```

### Gauge

```tsx
<AnedyaGauge
  value={28}
  min={0}
  max={100}
  unit="°C"
/>
```

When both `value` and `node`/`variable` are provided, the manual value is used initially until live data is received.

---

# Required props

The widgets support two operating modes.

## Live data mode

| Prop | Description |
|------|-------------|
| `node` | Anedya node instance |
| `variable` | Variable name to fetch |

Both props are required when displaying live data.

---

## Manual value mode

| Prop | Description |
|------|-------------|
| `value` | Value to display |

When `value` is supplied, `node` and `variable` are not required.

---

# Common optional props

Both widgets support the following optional props:

| Prop | Purpose |
|------|---------|
| `title` | Widget title |
| `unit` | Unit displayed beside the value |
| `theme` | Built-in or custom theme |
| `styles` | Style individual widget slots |
| `className` | Style the outer container |
| `width` | Widget width |
| `height` | Widget height |
| `minWidth` | Minimum width |
| `maxWidth` | Maximum width |
| `format` | Built-in value formatter |
| `formatOptions` | Formatting options |
| `formatValue` | Custom value formatter |
| `labelFormat` | Built-in timestamp formatter |
| `labelText` | Custom timestamp text |
| `timezone` | Timezone used for timestamps |
| `renderError` | Custom error state |
| `renderEmpty` | Custom empty state |
| `onDataChange` | React to incoming data and dynamically update widget props |

---

# Gauge-specific props

`AnedyaGauge` also supports additional configuration options:

- `min`
- `max`
- `arc`
- `track`
- `needle`
- `tick`
- `animation`
- `color`

The example application demonstrates many of these options and can be used as a reference when configuring your own gauges.

---

# Project purpose

This application is intended as a reference implementation for the Anedya Widgets SDK. It demonstrates the recommended setup, authentication flow, and common widget configurations, making it a useful starting point for building custom dashboards and IoT applications.