import React, { useState, useRef, useEffect } from 'react';
import coords, { getSvgCoords } from '../util/coords';
import { addPoint } from '@/util';
import dPathParse from 'd-path-parser';

/**
 * Add new points to a path with a bezier pen tool
 */
function PencilPathEditor(props: {
  svgRef: React.RefObject<SVGSVGElement>;
  onMouseMove?: (arg0: any) => void;
  onMouseDown?: (arg0: any) => void;
  onMouseUp?: (arg0: any) => void;
  onFinishDraw: (arg0: any) => void;
}) {
  const { svgRef, onMouseMove, onMouseDown, onMouseUp, onFinishDraw } = props;

  const [isDragging, setIsDragging] = useState(false);
  const [pathD, setPathD] = useState('');

  const pathData = dPathParse(pathD);

  const handleMouseMove = (e) => {
    if (isDragging) {
      // Add point to path
      const coords = getSvgCoords(svgRef.current, e);
      const newCommand = addPoint(coords, pathData);

      // Update
      const newD = pathD + newCommand;
      setPathD(newD);

      onMouseMove?.(e);
    }
  };

  const handleMouseDown = (e) => {
    onMouseDown?.(e);
    setIsDragging(true);

    const coords = getSvgCoords(svgRef.current, e);
    const newCommand = `M${coords.x},${coords.y}`;
    setPathD(newCommand);
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);

    const path = new window.paper.Path(pathD);

    // Simplify the path
    path.simplify(200);

    onFinishDraw?.(path.getPathData());
    setPathD('');

    onMouseUp?.(e);
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('mousedown', handleMouseDown);
      svg.addEventListener('mouseup', handleMouseUp);
      svg.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      if (svg) {
        svg.removeEventListener('mousedown', handleMouseDown);
        svg.removeEventListener('mouseup', handleMouseUp);
        svg.removeEventListener('mousemove', handleMouseMove);
      }
    };
    // eslint-disable-next-line
  }, [svgRef.current, isDragging, pathD]);

  return (
    <g>
      <path className="stroke-blue-500" strokeWidth={2} fill="none" d={pathD} />
    </g>
  );
}

export default PencilPathEditor;
