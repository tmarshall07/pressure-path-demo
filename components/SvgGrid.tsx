import PropTypes from 'prop-types';

import React, { memo } from 'react';

/**
 * A basic grid to be displayed on an SVG canvas
 */
const SvgGrid = (props: { spacing: number; width: number; height: number }) => {
  const { spacing = 50, width, height } = props;

  const horLines = [];
  const vertLines = [];

  const numRows = Math.ceil(height / spacing);
  const numColumns = Math.ceil(width / spacing);

  for (let i = 0; i < numRows; i += 1) {
    horLines.push(
      <line
        className="stroke-slate-800"
        key={i}
        x1={0}
        x2={spacing * numColumns}
        y1={i * spacing}
        y2={i * spacing}
        strokeWidth={i % 5 === 0 ? 2 : 1}
      />,
    );
  }

  for (let i = 0; i < numColumns; i += 1) {
    vertLines.push(
      <line
        className="stroke-slate-800"
        key={i}
        x1={i * spacing}
        x2={i * spacing}
        y1={0}
        y2={spacing * numRows}
        strokeWidth={i % 5 === 0 ? 2 : 1}
      />,
    );
  }

  return (
    <g>
      <g>
        {horLines}
        {vertLines}
      </g>
    </g>
  );
};

const { number } = PropTypes;

export default memo(SvgGrid);
