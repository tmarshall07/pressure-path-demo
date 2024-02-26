import React from 'react';

/**
 * A control point for a bezier curve
 */
const ControlPoint = ({ cpx, cpy, x, y }: { cpx: number; cpy: number; x: number; y: number }) => (
  <g>
    <circle className="fill-blue-300 stroke-white" cx={cpx} cy={cpy} r={5} />
    <line className="stroke-blue-200" x1={cpx} y1={cpy} x2={x} y2={y} />
  </g>
);

export default ControlPoint;
