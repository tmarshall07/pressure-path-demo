import React from 'react';

/**
 * Add new points to a path with a bezier pen tool
 */
function PencilPathEditor({ d }: { d: string }) {
  return (
    <g>
      <path className="stroke-blue-500" strokeWidth={2} fill="none" d={d} />
    </g>
  );
}

export default PencilPathEditor;
