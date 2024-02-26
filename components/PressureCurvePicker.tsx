import React, { useRef } from 'react';

import DraggableSvg from './DraggableSvg';
import SvgGrid from './SvgGrid';

function Control(props: {
  point: number[];
  index: number;
  svgRef: React.RefObject<SVGSVGElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  viewBox: { x: number; y: number; h: number; w: number };
  handleUpdatePoint: (arg0: number, arg1: { dx: number; dy: number }) => void;
}) {
  const { point, index, svgRef, containerRef, viewBox, handleUpdatePoint } = props;

  const handleMouseMove = (move) => {
    handleUpdatePoint(index, move);
  };

  return (
    <DraggableSvg svgRef={svgRef} containerRef={containerRef} onMouseMove={handleMouseMove} viewBox={viewBox}>
      <circle
        className="fill-blue-500 hover:fill-blue-600 focus:fill-blue-600 active:fill-blue-700"
        r={5}
        cx={point[0]}
        cy={point[1]}
      />
    </DraggableSvg>
  );
}

const height = 100;
const width = 100;
const padding = 10;
const viewBox = {
  x: -padding,
  y: -padding,
  w: width + 2 * padding,
  h: height + 2 * padding,
};

function PressureCurvePicker(props: {
  points: number[][];
  setPoints: (arg0: number[][]) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { points = [], setPoints, className = '', style = {} } = props;

  const pressurePoints = points.map((point) => [point[0] * width, (1 - point[1]) * height]);

  const svgRef = useRef();
  const containerRef = useRef();

  const handleUpdatePoint = (index, move) => {
    const newPoints = Array.from(points);
    const point = newPoints[index];
    let newY = point[1] - move.dy / height;

    if (newY >= 0 && newY <= 1) {
      if (Math.round(newY * 100) === 100) newY = 1;

      point[1] = newY;
      setPoints(newPoints);
    }
  };

  const lines = pressurePoints.map((point, i, array) => {
    if (i > 0) {
      return (
        <line
          className="stroke-blue-500"
          key={i}
          x1={array[i - 1][0]}
          y1={array[i - 1][1]}
          x2={point[0]}
          y2={point[1]}
        />
      );
    }

    return null;
  });

  const controls = pressurePoints.map((point, i) => (
    <Control
      point={point}
      index={i}
      containerRef={containerRef}
      svgRef={svgRef}
      viewBox={viewBox}
      handleUpdatePoint={handleUpdatePoint}
      key={i}
    />
  ));

  return (
    <div ref={containerRef} style={style} className={className}>
      <svg ref={svgRef} height="100%" width="100%" viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}>
        <g opacity={0.1}>
          <SvgGrid spacing={10} width={width} height={height} />
          <rect width={width} height={height} x={0} y={0} stroke="white" strokeWidth={1} fill="transparent" />
        </g>
        {lines}
        {controls}
      </svg>
    </div>
  );
}

export default PressureCurvePicker;
