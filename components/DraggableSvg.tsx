import React, { useState, useRef, useEffect } from 'react';

import coords from '../util/coords';

// DraggableSvg.propTypes = {
//   onMouseMove: func,
//   onMouseDown: func,
//   onMouseUp: func,
//   onClick: func,
//   svgRef: shape({
//     current: instanceOf(Element),
//   }).isRequired,
//   viewport: shape({
//     h: number,
//     w: number,
//   }),
//   children: oneOfType([arrayOf(node), node]),
//   hasCursor: bool,
// };

// DraggableSvg.defaultProps = {
//   onMouseMove: () => {},
//   onClick: () => {},
//   onMouseUp: () => {},
//   onMouseDown: () => {},
//   children: null,
//   hasCursor: false,
//   viewport: { w: 1920, h: 1080 },
// };

/**
 * Similar to Draggable.jsx but for an SVG canvas
 */
function DraggableSvg(props: {
  svgRef: React.RefObject<SVGSVGElement>;
  onMouseMove?: (arg0: { dx: number; dy: number }, arg1: any) => void;
  onMouseDown?: (arg0: any) => void;
  onMouseUp?: (arg0: any) => void;
  onClick?: (arg0: any) => void;
  hasCursor?: boolean;
  children: React.ReactNode;
}) {
  const { onMouseMove, onMouseUp, onMouseDown, onClick, hasCursor, children, svgRef } = props;

  const [isDragging, setIsDragging] = useState(false);
  const previousCoords = useRef();

  const handleMouseUp = (e) => {
    onMouseUp?.(e);
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      e.stopPropagation();
      e.preventDefault();

      const svgCoords = coords.getSvgCoords(svgRef.current, e);

      const dx = svgCoords.x - previousCoords.current.x;
      const dy = svgCoords.y - previousCoords.current.y;

      // Callback
      onMouseMove?.({ dx, dy }, e);

      previousCoords.current = svgCoords;
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
    // eslint-disable-next-line
  }, [isDragging]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    onMouseDown?.(e);

    previousCoords.current = coords.getSvgCoords(svgRef.current, e);
  };

  let classes = '';
  if (hasCursor) {
    if (isDragging) {
      classes += 'cursor-[grabbing]';
    } else {
      classes += 'cursor-[grab]';
    }
  }

  return (
    <g className={classes} onMouseDown={handleMouseDown} onClick={onClick}>
      {children}
    </g>
  );
}

export default DraggableSvg;
