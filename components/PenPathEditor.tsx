import React, { useState, useEffect } from 'react';
import dPathParse from 'd-path-parser';

import Point from './Point';
import ControlPoint from './ControlPoint';
import { getSvgCoords } from '@/util/coords';
import { addPoint, getDString, translateControlPoints } from '@/util';

export const mirrorCp = (cpx: number, cpy: number, x: number, y: number): { x: number; y: number } => ({
  x: Math.round(2 * x - cpx),
  y: Math.round(2 * y - cpy),
});

/**
 * Add new points to a path with a bezier pen tool
 */
function PenPathEditor(props: { d: string }) {
  const { d } = props;

  const pathData = dPathParse(d);
  const controlPoints = pathData.map((command, i) => {
    // Draw control points for last two points
    if (command.code === 'C' && i > pathData.length - 2) {
      const mirroredCp2 = mirrorCp(command.cp2.x, command.cp2.y, command.end.x, command.end.y);
      return (
        <g key={i}>
          <ControlPoint cpx={command.cp1.x} cpy={command.cp1.y} x={pathData[i - 1].end.x} y={pathData[i - 1].end.y} />
          <ControlPoint cpx={command.cp2.x} cpy={command.cp2.y} x={command.end.x} y={command.end.y} />
          {i === pathData.length - 1 && (
            <ControlPoint cpx={mirroredCp2.x} cpy={mirroredCp2.y} x={command.end.x} y={command.end.y} />
          )}
        </g>
      );
    }

    return null;
  });

  const points = pathData.map((command, i) => {
    return <Point key={i} isActive={pathData.length - 1 === i} x={command.end.x} y={command.end.y} />;
  });

  return (
    <g>
      <g>
        <path className="stroke-blue-500" strokeWidth={1} fill="none" d={d} />
      </g>
      <g>{points}</g>
      <g>{controlPoints}</g>
    </g>
  );
}

export default PenPathEditor;
