



import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "../../../src";


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
const emeraldTheme= {
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
    <div style={{ padding: "2rem", display: "flex", gap: 24, flexWrap: "wrap" }}>
      {/* Default appearance */}
      <CardWidget
        node={node}
        client={client}
        nodeId={nodeId}
        variable="humidity"
        title="Default"
        unit="%"
        precision={1}
      />

      {/* Reusable theme */}
      <CardWidget
        node={node}
        client={client}
        nodeId={nodeId}
        variable="humidity"
        title="Emerald Theme"
        unit="%"
        precision={1}
        theme={emeraldTheme}
      />

      {/* Per-instance overrides */}
      <CardWidget
        node={node}
        client={client}
        nodeId={nodeId}
        variable="humidity"
        title="Custom Classes"
        unit="%"
        precision={1}
        classNames={{
          value: "text-red-500 text-5xl",
          title: "uppercase tracking-wider",
        }}
      />

      {/* Plain CSS */}
      <CardWidget
        node={node}
        client={client}
        nodeId={nodeId}
        variable="humidity"
        title="CSS Classes"
        unit="%"
        precision={1}
        classNames={{
          container: "my-card",
          value: "my-card-value",
        }}
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
