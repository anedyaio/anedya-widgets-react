// StreamWidget.tsx
import React, { useEffect, useRef } from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { validateRequiredProps } from "../helpers/validate";

export interface StreamWidgetProps {
  client: any;
  nodeId: string;
  streamId: string;
  streamUrl: string;
}

export const StreamWidget: React.FC<StreamWidgetProps> = ({
  client,
  nodeId,
  streamId,
  streamUrl,
}) => {
  validateRequiredProps("StreamWidget", { client, nodeId, streamId, streamUrl }, [
    "client",
    "nodeId",
    "streamId",
    "streamUrl",
  ]);

  const mountedRef = useRef(false);

  useEffect(() => {
    if (!client || !nodeId || !streamId || !streamUrl) return;
    mountedRef.current = true;

    const anedya = (client as any)._anedya as Anedya;

    const node = anedya.NewNode(client, nodeId);
    console.log("Stream Node : ", node);
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(node)));

    const stream = node.getStream(streamId, streamUrl);

    stream.onData((data: any) => {
      if (!mountedRef.current) return;
      console.log("Stream Data:", data);
    });

    stream.onError((err: any) => {
      if (!mountedRef.current) return;
      console.error("Stream Error:", err);
    });

    stream
      .connect()
      .then(() => {
        if (mountedRef.current) console.log("Stream connected");
      })
      .catch((err: any) => {
        console.error("Stream connect failed:", err);
      });

    return () => {
      mountedRef.current = false;
      stream.disconnect();
      console.log("Stream disconnected");
    };
  }, [client, nodeId, streamId, streamUrl]);

  return(
    <>
    <h2>Stream</h2>
    </>
  );
};

export default StreamWidget;