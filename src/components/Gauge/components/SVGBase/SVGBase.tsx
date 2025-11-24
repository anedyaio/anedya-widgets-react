import React, { PureComponent, SVGProps } from "react";

class SVGBase extends PureComponent<SVGProps<SVGSVGElement>> {
  render() {
    const { children, ...props } = this.props;
    return <svg {...props}>{children}</svg>;
  }
}

export default SVGBase;
