# Anedya Public SDK — README

## Overview

The Anedya Public SDK helps you easily fetch data from Anedya and display it using prebuilt, customizable React widget components. These widgets allow you to quickly visualize IoT data such as latest values and timeseries data.

This SDK currently provides:

* **LatestDataComponent** — Displays the latest value of a variable.
* **ChartWidget** — Displays timeseries data between given timestamps.
* **LatestDataGauge** — A gauge‑style visualization of the latest value.

All widgets require **client**, **nodeId**, and **variable** props.

---

## 1. Set Up Your Project in Anedya Console

Before using the SDK, you must create a project in the Anedya console.
Follow the official guide here:

* **Project Setup:** [https://docs.anedya.io/getting-started/](https://docs.anedya.io/getting-started/)

To send (ingest) data into Anedya:

* **Submit Data API:** [https://docs.anedya.io/device/api/submitdata/](https://docs.anedya.io/device/api/submitdata/)

---

## 2. Create an Access Token

To use the SDK, you must generate an access token. There are two ways:

### **Option A: Create via Platform API**

Use the documentation here:

* [https://docs.anedya.io/platform-api/access-token-create/](https://docs.anedya.io/platform-api/access-token-create/)

### **Option B: Create via Anedya Dashboard**

1. Go to your project dashboard.
2. Navigate to **Access Tokens**.
3. Create a token using the UI.

### Token Body (Dashboard)

Below is the JSON body you will submit when creating a token through the dashboard:

```json
{
  "resources": {
    "nodes": [
      "----ADD YOUR NODES HERE---"
    ],
    "variables": [
      "----ADD YOUR VARIABLES HERE---"
    ],
    "vsglobalscopes": [
      "------ ADD YOUR Namespace HERE----"
    ],
    "vskeys": [
      "----- ADD YOUR KEY -----"
    ],
    "streams": [
      "----- ADD STREAMS HERE ----"
    ]
  },
  "allow": [
    "data::getsnapshot",
    "data::getlatest",
    "data::gethistorical",
    "cmd::sendcommand",
    "cmd::listcommands",
    "cmd::getstatus",
    "cmd::invalidate",
    "vs::getvalue",
    "vs::setvalue",
    "vs::scankeys",
    "vs::deletekeys",
    "streams::connect",
    "health::gethbstats",
    "health::getstatus"
  ]
}
```

### Important

Once your **token** and **tokenId** are created:
➡️ **Store them somewhere safe** — you will need both in your application.

You will also need the **nodeId** you included in the `nodes` array when creating the token. This is mandatory when using any widget.

---

## 3. Install the SDK

Run the following command:

```
npm install public-sdk
```

---

## 4. Import the SDK Components

```javascript
import initAnedyaClient, { LatestDataComponent, ChartWidget, LatestDataGauge } from "public-sdk";
```

---

## 5. Initialize the Anedya Client

```javascript
const client = initAnedyaClient(tokenId, token);
```

---

## 6. Using Widgets

All widgets require the following mandatory props:

* `client`
* `nodeId`
* `variable`

**Note:** Every variable you fetch must be added to the `variables` array when creating the token.

### Additional Props for ChartWidget

* `from` — start timestamp (ms)
* `to` — end timestamp (ms)

### Using Current Time and 24 Hours Ago

If you want your chart to show data from the last 24 hours, you can dynamically generate the timestamps like this:

```javascript
const currentTime = Date.now(); // Current time in ms
twentyFourHoursAgo = currentTime - 86400 * 1000; // 24 hours ago in ms
```

You can then pass these values into the `from` and `to` props:

```javascript
<ChartWidget
  client={client}
  nodeId={nodeId}
  variable="humidity"
  from={twentyFourHoursAgo}
  to={currentTime}
/>
```

* `from` — start timestamp (ms)
* `to` — end timestamp (ms)

---

## 7. Example Usage

```javascript
function App() {
  const nodeId = "";
  const tokenId = "";
  const token = "";
  const client = initAnedyaClient(tokenId, token);


  const currentTime = Date.now();          // ms timestamp
const twentyFourHoursAgo = currentTime - 86400 * 1000;  // ms timestamp


  return (
    <div style={{ padding: "2rem" }}>
      <h1>Test Widget SDK</h1>

      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>

        {/* Chart Widget */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <ChartWidget
            client={client}
            nodeId={nodeId}
            variable="humidity"
              from={twentyFourHoursAgo}
            to={currentTime}
          />
        </div>

        {/* Latest Data Component */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <LatestDataComponent
            client={client}
            nodeId={nodeId}
            variable="humidity"
          />
        </div>

        {/* Gauge Component */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <LatestDataGauge
            client={client}
            nodeId={nodeId}
            variable="humidity"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## You're ready to use the Anedya Public SDK!

If you need more help, refer to the official Anedya documentation here: [https://docs.anedya.io/](https://docs.anedya.io/)
