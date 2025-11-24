import React, { PureComponent } from "react";
import { line, scaleLinear } from "d3";



class Pointer extends PureComponent {
  render() {
    const {
      width = 12.5,
      head = (0.8 * 250) / 2 - 5,
      tail = 5,
      value = -5,
      tooltip = "",
      center = { x: 125, y: 135 },
      minAngle,
      maxAngle,
      disabled
    } :any= this.props;

    const pointerLine = line()([
      [width / 2, 0],
      [0, -head],
      [-(width / 2), 0],
      [0, tail],
      [width / 2, 0]
    ]);
    const valueScale = scaleLinear()
      .domain([0, 1])
      .range([minAngle, maxAngle]);
    const pointerValue = valueScale(value);

    const showTooltip = (e: React.MouseEvent, text: string) => {
  const tooltip = document.getElementById("gauge-tooltip");
  if (!tooltip || !text) return;

  tooltip.textContent = text;
  tooltip.style.opacity = "1";
  tooltip.style.transform = "translateY(0px)";
  moveTooltip(e);
};

const moveTooltip = (e: React.MouseEvent) => {
  const tooltip = document.getElementById("gauge-tooltip");
  if (!tooltip) return;

  tooltip.style.left = e.clientX + 10 + "px";
  tooltip.style.top = e.clientY - 20 + "px";
};

const hideTooltip = () => {
  const tooltip = document.getElementById("gauge-tooltip");
  if (!tooltip) return;

  tooltip.style.opacity = "0";
  tooltip.style.transform = "translateY(-5px)";
};

    return (
      // <Tooltip
      //   title={tooltip}
      //   disableFocusListener={!Boolean(tooltip)}
      //   disableTouchListener={!Boolean(tooltip)}
      //   disableHoverListener={!Boolean(tooltip)}
      // >
      <g className="pointer-wrapper" data-tooltip={tooltip}>
        <path
          className="gauge-pointer"
          d={pointerLine ?? undefined}
          transform={`translate(${center.x}, ${
            center.y
          }) rotate(${pointerValue})`}
          fill={"#333"}
          opacity={disabled ? 0.3 : undefined}
          style={{
            transition: "all 0.25s 0.25s",
            color:"white"
          }}
            onMouseEnter={(e) => showTooltip(e, tooltip)}
  onMouseMove={(e) => moveTooltip(e)}
  onMouseLeave={hideTooltip}
        >
            {tooltip && <title>{tooltip}</title>}
        </path>
        </g>
      // </Tooltip>
    );
  }
}

export default Pointer;
