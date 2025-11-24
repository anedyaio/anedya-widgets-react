import React, { useCallback, useMemo } from "react";
import { scaleLinear } from "d3";

import {
  SVGBase,
  Pointer,
  InvertedTriangle,
  UnitOfMeasurement,
  GaugeArc,
  Label
} from "./components";

import "../../index.css"
const defaultSize = 250;

const Gauge = ({
  height,
  width,
  disabled,
  value = -1,
  min = 0,
  max = 100,
  maxAngle = 135,
  minAngle = -135,
  tickCount = 5,
  arcSegments = [{ min: 0, max: 1, color: "skyblue" }],
  labelProps = {
    offsetText: -7.5
  },
  uom = "",
  uomProps = {
    offsetText: -10,
    //-7.5
  },
  pointerLabel = "",
  ...props
}) => {
  const gaugeOrigin = {
    x: 140,
    y: 140
  };

  const valueScale = useCallback(
    scaleLinear()
      .domain([min, max])
      .range([0, 1]),
    [min, max]
  );

  /** Value scaled to [0,1] */
  const valueRef = useMemo(() => valueScale(value), [value, valueScale]);

  return (
    <>
      <SVGBase
        className="gauge"
        width={width ? width : height ? height : defaultSize}
        height={height ? height : width ? width : defaultSize}
        viewBox={"0 0 280 280"}
        style={{
          transition: "all 0.25s 0.25s",
   
        }}
        {...props}
      >
        <GaugeArc
          stroke={"#344c69"}
          strokeWidth={4}
          center={gaugeOrigin}
          maxAngle={maxAngle}
          minAngle={minAngle}
          opacity={disabled ? 0.25 : undefined}
        />
        <Label
          disabled={disabled}
          center={gaugeOrigin}
          tickCount={tickCount}
          min={min}
          max={max}
          maxAngle={maxAngle}
          minAngle={minAngle}
          {...labelProps}
        />
        {arcSegments.map(({ min, max, color, node }, idx) => (
          <g key={`arcsegment-${idx}`}>
            {typeof node === "function" ? node(disabled) : node}
            <GaugeArc
              key={`gauge-arcsegment-${idx}`}
              inset={12}
              min={min}
              max={max}
              stroke={
                disabled && !node
                  ? `rgba(${idx * 15},${idx * 15},${idx * 15}, ${idx * 0.1 +
                      0.1})`
                  : color
              }
              strokeWidth={20}
              center={gaugeOrigin}
              maxAngle={maxAngle}
              minAngle={minAngle}
            />
          </g>
        ))}
        <InvertedTriangle center={gaugeOrigin} disabled={disabled} />
        <Pointer
          value={disabled ? -0.025 : valueRef}
          center={gaugeOrigin}
          disabled={disabled}
          maxAngle={maxAngle}
          minAngle={minAngle}
          tooltip={pointerLabel ? pointerLabel : value}
        />
        <UnitOfMeasurement
        value={value}
          uom={uom}
          disabled={disabled}
          center={gaugeOrigin}
          {...uomProps}
        />
      </SVGBase>
    </>
  );
};

export default Gauge;
