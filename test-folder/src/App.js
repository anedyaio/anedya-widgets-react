import React from "react";
import { LatestDataComponent, initAnedyaClient } from "yt-tutorial-app";

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
    </div>
  );
}

export default App;

// Would you like me to show you a final clean layout for your SDK folder structure (src/, index.ts, hooks/, components/) so you can make sure all imports and exports line up perfectly?
//go back to failsafe chat part
//paclage json optimized ==>Would you like me to show you what a final clean package.json for your SDK should look like too (perfectly ready for npm publish)?
// I can also show you a recommended way to handle MUI + peer React dependencies to avoid the useState errors you were seeing earlier — do you want me to do that next
//is there a way to add a check or failsafe in case of infinte renders by the user's app? i dont want that to happen because that will cause infinite api calls, and thats bad bcs it will probably cause api issues