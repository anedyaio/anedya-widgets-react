import React from "react";
import { Gradient } from "../components";

const useGradient = (startColour:string, stopColour:string, id:string) => {
  return {
    color: `url(#${id})`,
    // node: disabled => (
    //   <Gradient
    //     start={startColour}
    //     end={stopColour}
    //     id={id}
    //     disabled={disabled}
    //   />
    // )
  };
};

export default useGradient;
