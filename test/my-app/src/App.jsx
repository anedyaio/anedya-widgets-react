import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import {
  LatestDataWidget,
  // anedyaClientInit,
  ChartWidget,
  LatestDataGauge,
} from "../../../src/index";

function App() {
const tokenId = "sdaIC9xpHKdPQpWXPtOlG1Pl";
const token = "eMYc82DiKX2oO9TgXylCCeyugok8MDOY65XMTRDLdsh2ENHOi0Tyv3RmfCuLQ6kb";
const nodeId = "019e8d46-e895-713f-b763-6969b36e37a4";


const anedya = new Anedya();
const config = anedya.newConfig(tokenId, token);
const client = anedya.newClient(config);

  // const client = anedyaClientInit(tokenId, token);
//default min and max 
//client ki implementatrion bahar lelo

  //019f5f58-2a58-733e-81cc-fbec233a9856
  //wss://ZxBpErVPCj.acs-r1.ap-in-1.anedya.io/v1/streams/connect

  const currentTime = Date.now();          // ms timestamp
const twentyFourHoursAgo = currentTime - 86400 * 1000;  // ms timestamp

  return (
   <div
      style={{
        padding: "2rem",
        backgroundColor:"white"
      }}
    >
      <h1 style={{
        color:"black"
      }}>Test Widget SDK</h1>
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
  anedya={anedya}
  client={client}
  nodeId={nodeId}
  variable="humidity"
  from={twentyFourHoursAgo}
  to={currentTime}
  width={800}
  height={500}
/>
        </div>

      
      </div>
    </div>
  );
}

export default App;


//create react app
//link public-widget-sdk
//npm run dev
//send this file tp yash to copy paste 