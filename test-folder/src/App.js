import React from "react";
import { renderLatestData,initAnedyaClient } from "widget-sdk";

function App() {


  const nodeId="0199c8d5-ce04-78db-aaed-69d8c0222493"
  const tokenId="BLg4AESmsdYf88n4tPzB9PUV"
  const token="RLqobgKSW9y2pcP6snBQIEA6VjxltMpzTLardZax8nRG9vjmUnrFKKDdTZNv238Q"
  const { anedya, client } = initAnedyaClient(tokenId, token);

  const { WidgetComponent } = renderLatestData(
    client,
    anedya,
    nodeId,
    "temperature",
    "Latest Value",
    0,
    "#ffeaea",
    "red",
    "18px"
  );


  return (
    <div style={{ padding: "2rem" }}>
      <h1>Test Widget SDK</h1>
      {WidgetComponent}
      {/* 
      <LatestDataWidget
        client={clientInstance.client}
        anedya={anedya}
        nodeId={nodeId}
        variable="temperature"
        refreshInterval={5000}
        backgroundColor="#ffeaea"
        textColor="red"
        fontSize="18px"
      /> */}
    </div>
  );
}

export default App;
