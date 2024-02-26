import * as React from 'react';

const SvgViewer = React.forwardRef((props: React.SVGProps<SVGSVGElement>, ref) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    style={{
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: 1.5,
    }}
    viewBox="0 0 1920 1080"
    {...props}
    ref={ref}
  />
));

SvgViewer.displayName = 'SvgViewer';

export default SvgViewer;
