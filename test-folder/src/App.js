import React from "react";
import { LatestDataComponent, initAnedyaClient ,ChartWidget} from "widget-sdk";

function App() {
  const nodeId = "0199c8d5-ce04-78db-aaed-69d8c0222493";
  const tokenId = "BLg4AESmsdYf88n4tPzB9PUV";
  const token =
    "RLqobgKSW9y2pcP6snBQIEA6VjxltMpzTLardZax8nRG9vjmUnrFKKDdTZNv238Q";
  const client = initAnedyaClient(tokenId, token);


  return (
    <div style={{ padding: "2rem" }}>
      <h1>Test Widget SDK</h1>

      <LatestDataComponent
        client={client}
        nodeId={nodeId}
        variable="temperature"
        title="Temperature Sensor"
        unit={"°C"}
        styles={{
          container: {
            width: 350,
            height: 200,
            // bgcolor: "#3f50b5",
             background: 'linear-gradient(to right, #5a6394, #1328a8)',
      
            // bgcolor:"linear-gradient(180deg, #3f50b5, #3f50b5)",
            borderRadius: 4,
            gap: 1,
          },
          label: { fontWeight: 500, color: "#ffffff" ,fontSize:"20px"},
          value: { fontWeight: 700 ,fontSize:"100px"},
          unit: { fontWeight: 400, color: "#ffffff" ,fontSize:"30px"},
          fontFamily: "Arial, sans-serif", // global font
        }}


      />
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
/>

    </div>
  );
}

export default App;
