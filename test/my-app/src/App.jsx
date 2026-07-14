import React from "react";
import {
  LatestDataWidget,
  anedyaClientInit,
  ChartWidget,
  LatestDataGauge,
  // StreamWidget
} from "public-widget-sdk";

// import {StreamWidget} from "public-widget-sdk"

function App() {
  
  const tokenId = "";
  const token = "";
  const nodeId = "";
  const client = anedyaClientInit(tokenId, token);
  
  console.log(client, "client");

  const currentTime = Date.now(); // ms timestamp
  const twentyFourHoursAgo = currentTime - 86400 * 1000; // ms timestamp

  return (
    <div
      style={{
        padding: "2rem",
      }}
    >
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

            alignItems: "center",
          }}
        >
          <ChartWidget
            client={client}
            nodeId={nodeId}
            variable="humidity"
            from={twentyFourHoursAgo}
            to={currentTime}
            limit={20}
            title="Humidity Trend"
            styles={{
              container: {
                // width: 450,
                // height: 300,
                //rgb(248, 249, 250)
                background: "rgb(248, 249, 250)",
                borderRadius: 10,
                // border: "1px solid rgba(211, 216, 220, 1)",
              },
              title: { color: "#000000", fontSize: "20px", fontWeight: 500 },
              chart: {
                strokeColor: "rgba(0, 143, 251, 0.85)",
                strokeWidth: 3,
                gradientColors: ["rgba(0, 143, 251, 0.85)", "#ffe0b2"],
              },
              tooltip: {
                backgroundColor: "rgba(202, 10, 10, 0.75)",
                color: "#fff",
                fontSize: "13px",
              },
            }}
            tickCount={5}
            //optional super simple options
            //            xTickFormat="YYYY-MM-DD"
            // yTickFormat="0.00"          // 2 decimal places
            // tooltipFormat="YYYY/MM/DD HH:mm"

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
        </div>

        <div
          style={{
            display: "flex",

            alignItems: "center",
          }}
        >
          <LatestDataWidget
            client={client}
            nodeId={nodeId}
            variable="humidity"
            title="Humidity Sensor"
            unit={"°C"}
            styles={{
              container: {
                // width: 350,
                // height: 200,
                // background:
                //   "linear-gradient(to right, rgb(47, 99, 255), rgb(20, 110, 180))",

                borderRadius: 10,
                gap: 1,
              },
              label: { fontWeight: 500, color: "#000000", fontSize: "20px" },
              value: { fontWeight: 700, fontSize: "100px" },
              unit: { fontWeight: 400, color: "#000000", fontSize: "40px" },
            }}
            displayText={(value, unit) => {
              return {
                text: `${value}`,
                unitText: unit,
                position: "right", // "left" | "right" | "top" | "bottom"
                unitStyle: "subscript", // "normal" | "subscript" | "superscript"
              };
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
        </div>

        <div
          style={{
            display: "flex",

            alignItems: "center",
          }}
        >
          <LatestDataGauge
            client={client}
            nodeId={nodeId}
            variable="humidity"
            title="Humidity Sensor"
            unit={"°C"}
            showNeedle={false}
            styles={{
              container: {
                // width: 350,
                // height: 200,
                // background:
                //   "linear-gradient(to right, rgb(47, 99, 255), rgb(20, 110, 180))",
                borderRadius: 10,
              },
              label: { fontWeight: 500, color: "#000000", fontSize: "20px" },
              value: { fontWeight: 700, fontSize: "30px", color: "#ffffff" },
              unit: { fontWeight: 400, color: "#ffffff", fontSize: "300px" },
            }}
            onStyleChange={(value) => {
              if (value > 80) {
                return {
                  value: { color: "red" },
                  label: { color: "orange" },
                };
              }

              return {}; // keep original styling
            }}
          />
        </div>

        {/* <div
          style={{
            display: "flex",

            alignItems: "center",
          }}
        >
          <StreamWidget
            client={client}
            nodeId={nodeId}
            streamId="019d3dbe-f14f-7365-b339-bcefbcc848a0"
            streamUrl="wss://ZxBpErVPCj.acs-r1.ap-in-1.anedya.io/v1/streams/connect"
          />
        </div> */}
      </div>
    </div>
  );
}

export default App;
