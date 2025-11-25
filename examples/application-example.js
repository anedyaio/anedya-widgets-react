import React from "react";
import {
  LatestDataComponent,
  initAnedyaClient,
  ChartWidget,
  LatestDataGauge,
} from "yt-tutorial-app";

function App() {
  const nodeId = "";
  const tokenId = "";
  const token = "";
  const client = initAnedyaClient(tokenId, token);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Test Widget SDK</h1>
      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 200,
            alignItems: "center",
          }}
        >
          <LatestDataComponent
            client={client}
            nodeId={nodeId}
            variable="humidity"
            title="Humidity Sensor"
            unit={"°C"}
            styles={{
              container: {
                width: 350,
                height: 200,
                background:
                  "linear-gradient(to right, rgb(47, 99, 255), rgb(20, 110, 180))",

                borderRadius: 10,
                gap: 1,
                padding: "20px",
              },
              label: { fontWeight: 500, color: "#ffffff", fontSize: "20px" },
              value: { fontWeight: 700, fontSize: "100px" },
              unit: { fontWeight: 400, color: "#ffffff", fontSize: "30px" },
              fontFamily: "Arial, sans-serif", // global font
            }}
          />
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
            tooltipFormatter={(p) =>
              `${new Date(p.timestamp).toLocaleString()}: ${p.value}°C`
            }
          />
        </div>

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
        />
      </div>
    </div>
  );
}

export default App;
