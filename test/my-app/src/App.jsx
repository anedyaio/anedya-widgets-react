import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "../../../src";
import { GaugeWidget } from "../../../src/components/GaugeChart/GaugeChartWidget";
import "../../../dist/styles.css";

const tokenId = "sdaIC9xpHKdPQpWXPtOlG1Pl";
const token =
  "eMYc82DiKX2oO9TgXylCCeyugok8MDOY65XMTRDLdsh2ENHOi0Tyv3RmfCuLQ6kb";
const nodeId = "019e8d46-e895-713f-b763-6969b36e37a4";

const anedya = new Anedya();
const config = anedya.newConfig(tokenId, token);
const client = anedya.newClient(config);
const node = anedya.newNode(client, nodeId);

/**
 * A reusable theme, shareable across every CardWidget instance in your
 * app. Only specify the slots you actually want to change from the
 * built-in default — anything omitted falls back to lightTheme/darkTheme.
 */
const emeraldTheme = {
  classNames: {
    container: "bg-emerald-50 border-emerald-200",
    title: "text-emerald-700",
    value: "text-emerald-900",
    label: "text-emerald-500",
  },
};

const commonProps = { node, variable: "humidity" };

export default function App() {
  return (
    
    <div
      style={{ padding: "2rem", display: "flex", gap: 24, flexWrap: "wrap" }}
    >
      {/* <GaugeWidget
        {...commonProps}
        // label="Gauge Chart"
        // min={0}
        // max={100}
        // size={400}
        // value={99}
        // width={400}
        // height={400}
        // valueLabel={{ precision: 1 }}
        // arc={{
        //   startAngle: -90,
        //   endAngle: 90,
        //   // radius: not working proper
        //   thickness: 70,
        //   // cornerRadius:100
        // }}
        track={{
          show: true,
          color: "",
        }}
        fillMode="progress"
        // color={["red","orange", "yellow", "green"]}
        color="#1fa2ff"
        needle={{
          show: true,
          type: "line",
          length: "medium",
          width: 3,
          color: "white",
          capRadius: 7,
        }}
        // needleLabel={{
        //   show: true,
        //   formatter: () => {
        //     "Hello";
        //   },
        // }}
        // labels={{
        //   show: true,
        //   position: "outside",
        // }}
        // scale={{
        //   minLabel: "Hello",
        //   maxLabel: "World",
        // }}
        // ticks={{
        //   show: true,
        //   count: 10,
        //   position: "outside",
        //   length: 10,
        //   labels: true,
        // }}
        animation={{
          duration: 4000,
          easing: "easeElasticOut", // easeCubicOut, easeElasticOut
        }}
        // tooltip={{
        //   show:false,
        // }}
        // classNames={{
        //   title: "text-white",
        //   tickLabel: "text-white text-lg",
        //   label: "text-red",
        //   value: "text-white",
        // }}
        theme="dark"
      /> */}

      <GaugeWidget
        {...commonProps}
        // color="#1fa2ff"
        // color={["#9796f0", "#fbc7d4"]}
        // color={["#799F0C", "#FFE000"]}
        color={["#A5FECB", "#20BDFF", "#5433FF"]}
        title="Gauge Chart Widget"
        // value={40}
        // labelText={"Hello"}
        // valueLabel={"Hello"}
        arc={{
          // radius:400,
          // cornerRadius:10,
          thickness: 80,
        }}
        animation={{
          duration: 4000,
          easing: "easeElasticOut", // easeCubicOut, easeElasticOut
        }}
        needle={{
          color: "white",
          length: "short",
          type: "triangle",
          animation: true,
        }}
        theme="dark"
        styles={{
          container: "",
          title: "text-black text-[90px]",
        }}
      />

      <GaugeWidget
        title="Battery Level"
        value={65}
        unit="%"
        min={0}
        max={100}
        className="w-64 mx-auto"
        theme="dark"
      />

      <GaugeWidget
        title="CPU Usage"
        value={78}
        unit="%"
        theme="dark"
        // 'style' affects ONLY the outer wrapper <div>
        style={{
          backgroundColor: "#1e1e2f",
          borderRadius: "16px",
          padding: "10px",
        }}
        // 'styles' affects specific internal SVG/HTML slots via Tailwind classes
        styles={{
          container: "border border-gray-700", // merges with outer wrapper
          title: "text-purple-400 text-xs uppercase tracking-wider",
          value: "text-white text-2xl font-mono",
          unit: "text-gray-400 text-sm",
          label: "text-gray-500 text-[10px]",
          bar: "fill-gradient-to-r from-purple-500 to-pink-500", // if using Tailwind gradients
          needle: "stroke-pink-400 stroke-2",
          needleCap: "fill-pink-400",
        }}
      />

      <GaugeWidget
        value={85}
        theme="dark" // Applies gaugeDarkTheme internally
        // 1. style: Sets fixed size and injects CSS variables for text scaling
        style={{
          width: "400px",
          height: "400px",
          padding: 0,
        }}
        // 2. styles: Override internal slot classes
        styles={{
          container: "bg-gray-900 rounded-2xl border border-red-700", // Merged with dark theme's container
          bar: "text-emerald-400", // Overrides dark theme's "text-indigo-400"
          needle: "text-yellow-500",
          needleCap: "red", // Makes the needle yellow
          value: "text-emerald-50", // Overrides dark theme's "text-white"
          label: "text-gray-400", // Overrides dark theme's "text-slate-500"
        }}
      />

      <GaugeWidget
        value={75}
        needle={{
          type: "triangle", // 'drop' or 'triangle' use fill
        }}
        styles={{
          bar: "text-red-500",
          track: "text-yellow-300",
          needle: "text-green-600",
          needleCap: "text-green-600",
        }}
      />

      <GaugeWidget
        responsive={true} // ensure it reacts to container
        aspectRatio={1.6}
        value={34}
        valueLabel={{
          show: true,
        }}
        // make it wider than tall, reducing overall height
        // OR set fixed size:
        size={300}
        styles={{
          container: "bg-gray-900 rounded-2xl border border-red-700",
        }}
      />

      {/* // 1. Show a custom static text */}
      <GaugeWidget
        value={78}
        labelText={() => "Last reading"} // Always shows "Last reading"
      />

      {/* // 2. Format the timestamp exactly how you want */}
      <GaugeWidget
        value={78}
        labelText={(timestamp) =>
          `Updated at ${new Date(timestamp).toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}`
        }
        // Output: "Updated at 02:30:45 PM"
      />

      {/* // 3. Show relative time with custom wording */}
      <GaugeWidget
        value={78}
        labelText={(timestamp) => {
          const diff = Math.floor((Date.now() - timestamp) / 60000);
          if (diff < 1) return "Just now";
          if (diff < 60) return `${diff} min ago`;
          return `${Math.floor(diff / 60)} hours ago`;
        }}
      />

      {/* // 4. Hide the label entirely (return null or empty string) */}
      <GaugeWidget
        value={78}
        labelText={() => null} // No label shown
      />
    </div>
  );
}

{
  /* 
//create react app
//link public-widget-sdk
//npm run dev
//send this file tp yash to copy paste  */
}
