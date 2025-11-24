import React, { PureComponent } from "react";

class Gradient extends PureComponent {
  render() {
    const { start, end, id, disabled }:any = this.props;
    return (
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={disabled ? "rgba(0,0,0,0)" : start} />
          <stop offset="100%" stopColor={disabled ? "rgba(0,0,0,0.4)" : end} />
        </linearGradient>
      </defs>
    );
  }
}

export default Gradient;
