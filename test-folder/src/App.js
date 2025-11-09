import React from "react";
import { LatestDataComponent, initAnedyaClient ,ChartWidget} from "widget-sdk";

function App() {
  const nodeId = "0199c8d5-ce04-78db-aaed-69d8c0222493";
  const tokenId = "BLg4AESmsdYf88n4tPzB9PUV";
  const token =
    "RLqobgKSW9y2pcP6snBQIEA6VjxltMpzTLardZax8nRG9vjmUnrFKKDdTZNv238Q";
  const client = initAnedyaClient(tokenId, token);
  //return component directly -- done
  //return only client -- done
  //remove the refresh button --- done
  //change how props is passed -- styling props in one object that you directly just destructure instead of passing singularly, should follow mui convention
  //label
  //number
  //unit
  //if title is not passed then it should handle that
  //border radius should also be passable
  //centreting and foct size relative to width and height of card
  //diff levels of numbners -- diff colors -- pass a callback func to user-- o lket the user decide the numbers
  // add a check or a failsafe for infinite renders
//test all these 

  //rm -rf yt-tutorial-app/node_modules/react
  //rm -rf yt-tutorial-app/node_modules/react-dom

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
  strokeColor="rgba(0, 143, 251, 0.85)"
   gradientColors={["rgba(0, 143, 251, 0.85)", "#ffe0b2"]}
  tooltipFormatter={(d) => `${new Date(d.timestamp).toLocaleString()}: ${d.value}°C`}
/>
    </div>
  );
}

export default App;
