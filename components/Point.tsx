import React from 'react';
import PropTypes from 'prop-types';

const Point = ({ x, y, isActive }: { x: number; y: number; isActive: boolean }) => (
  <g>
    <circle
      fill={isActive ? 'blue' : 'white'}
      className={isActive ? 'stroke-blue-300' : 'stroke-red-300'}
      strokeWidth={isActive ? 2 : 1}
      cx={x}
      cy={y}
      r={5}
    />
  </g>
);

export default Point;
