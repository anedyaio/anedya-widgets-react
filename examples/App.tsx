import React from "react";
// import { LatestDataWidget, initAnedyaClient } from "your-new-sdk";

function App() {
    const  tokenId="pvvYKc5CJW4d32cnIEECrSU"
const token="TXtad1e9J2LP4MimuWqAI8pDvqj02RKbt1uuhvFn0xWP1HHxp4cOWFOStyZa8oDk"
const nodeId="01979c1d-4fba-7424-b186-f89caeb7fb8f"
const variableIdentifier="temperature"

  // User initializes the client themselves
//   const clientInstance = initAnedyaClient(
//    tokenId,
//     token,
//   );

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>📊 Anedya Dashboard</h1>

      {/* Latest Data Widget for temperature */}
      {/* <LatestDataWidget
        client={clientInstance.client}
        nodeId={nodeId}
        variable={"temperature"}
        refreshInterval={5000}
        backgroundColor="#ffeaea"
        textColor="red"
        fontSize="18px"
      /> */}

      {/* Latest Data Widget for humidity */}
      {/* <LatestDataWidget
     client={clientInstance.client}
        nodeId={nodeId}
        variable="humidity"
        refreshInterval={5000}
        backgroundColor="#eaf7ff"
        textColor="#0066cc"
        fontSize="16px"
      /> */}
    </div>
  );
}

export default App;
