import React from "react";
import {
  LatestDataWidget,
  anedyaClientInit,
  ChartWidget,
  LatestDataGauge,
} from "../../../src/index";

import { BarChartWidget } from "../../../src/components/Bar Chart/BarChartWidgets";

function App() {
  const tokenId = "sdaIC9xpHKdPQpWXPtOlG1Pl";
  const token =
    "eMYc82DiKX2oO9TgXylCCeyugok8MDOY65XMTRDLdsh2ENHOi0Tyv3RmfCuLQ6kb";
  const nodeId = "019e8d46-e895-713f-b763-6969b36e37a4";
  const client = anedyaClientInit(tokenId, token);
  //default min and max
  //client ki implementatrion bahar lelo

  //019f5f58-2a58-733e-81cc-fbec233a9856
  //wss://ZxBpErVPCj.acs-r1.ap-in-1.anedya.io/v1/streams/connect

  const currentTime = Date.now(); // ms timestamp
  const twentyFourHoursAgo = currentTime - 86400 * 1000; // ms timestamp

  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: "white",
      }}
    >
      <h1
        style={{
          color: "black",
        }}
      >
        Test Widget SDK
      </h1>
      <div
        style={{
          display: "flex",
          flexDirection:"column",
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
            width={800}
            theme="dark"
            height={500}
            title="Test Area Chart"
          />
        </div>

        <div
          style={{
            display: "flex",

            alignItems: "center",
          }}
        >
          <BarChartWidget
            // client={client}
            // nodeId={nodeId}
            // variable="humidity"
            // from={twentyFourHoursAgo}
            // to={currentTime}
            width={800}
            theme="dark"
            height={500}
            title="Test Bar Chart"
            // styles={{
            //   chart:{
            //     barColor:"",
            //     barHoverColor:"",
            //     tooltipBg:"",
            //     tooltipColor:"",
            //     barRadius:0
            //   }
            // }}
            // data={[
            //   { name: "A", value: 1 },
            //   { name: "B", value: 2 },
            //   { name: "C", value: 3 },
            //   { name: "D", value: 4 },
            //   { name: "E", value: 5 },
            //   { name: "F", value: 6 },
            //   { name: "G", value: 7 },
            //   { name: "H", value: 8 },
            //   { name: "I", value: 9 },
            //   { name: "J", value: 10 },
            //   { name: "K", value: 11 },
            //   { name: "L", value: 12 },
            //   { name: "M", value: 13 },
              // { name: "N", value: 14 },
              // { name: "O", value: 15 },
              // { name: "P", value: 16 },
              // { name: "Q", value: 17 },
              // { name: "R", value: 18 },
              // { name: "S", value: 19 },
              // { name: "T", value: 20 },
              // { name: "U", value: 21 },
              // { name: "V", value: 22 },
              // { name: "W", value: 23 },
              // { name: "X", value: 24 },
              // { name: "Y", value: 25 },
              // { name: "Z", value: 26 },
            // ]}
            // xTickCount={5}
            // yTickCount={2}
          />
        </div>

        {/* <div
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
        </div> */}
      </div>
    </div>
  );
}

export default App;

//create react app
//link public-widget-sdk
//npm run dev
//send this file tp yash to copy paste
