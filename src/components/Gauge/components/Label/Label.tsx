import React, { PureComponent } from "react";
import { scaleLinear, line } from "d3";

const getTickRef = (tickCount:any, minVal:any, maxVal:any, minAngle:any, maxAngle:any) => {
  if (tickCount % 2 === 0)
    console.warn(
      "Ticks should be odd numbered to ensure a tick in in the middle of the gauge."
    );

  const idxToRef = scaleLinear()
    .domain([0, tickCount - 1])
    .range([0, 1]);

  const idxToVal = scaleLinear()
    .domain([0, tickCount - 1])
    .range([minVal, maxVal]);

  const refToDeg = scaleLinear()
    .domain([0, 1])
    .range([minAngle, maxAngle]);

  return [...Array(tickCount)].map((v, i) => ({
    index: i,
    val: idxToVal(i),
    deg: refToDeg(idxToRef(i))
  }));
};

const tickLineLong = line()
  .x(0)
  .y((d, i) => i)(Array.from({ length: 35 }));

const tickLineShort = line()
  .x(0)
  .y((d, i) => i)(Array.from({ length: 12 }));

class Label extends PureComponent {
  render() {
    const {
      disabled,
      center,
      tickCount,
      min,
      max,
      maxAngle,
      minAngle,
      offsetText,
      length = 300 / 2 - 30
    }:any = this.props;

    const ticks = getTickRef(tickCount, min, max, minAngle, maxAngle);

    return ticks.map(({ val, deg, index }) => {
      return (
        <g
          className="gauge-label"
          style={{ userSelect: "none", textAlign: "center" }}
          key={val}
          transform={`translate(${center.x},${center.y}) rotate(${deg})`}
        >
          <path
           d={
  (index === 0 || index === ticks.length - 1
    ? tickLineLong
    : tickLineShort) ?? undefined
}
            stroke="#344c69"
            strokeWidth="1"
            transform={`translate(0,${7.5 - length})`}
            style={{ transition: "all .25s .25s" }}
            opacity={disabled ? 0.4 : undefined}
          />
          <text
            transform={`translate(${offsetText},${-length})`}
            style={{ transition: "all .25s .25s", fontSize: "85%" }}
            opacity={disabled ? 0.4 : undefined}
          >
            {Number(val)}
          </text>
        </g>
      );
    });
  }
}

export default Label;
