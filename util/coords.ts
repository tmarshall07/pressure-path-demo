/**
 * Gets the svg x and y coordinates for a click event on an <svg> element
 *
 * @param {Element} svgElement - an <svg> element
 * @param {Event Object} event
 * @returns { x: number, y: number }
 */ export const getSvgCoords = (svgElement, event) => {
  const pt = svgElement.createSVGPoint(); // Created once for document
  pt.x = event.clientX;
  pt.y = event.clientY;

  // The cursor point, translated into svg coordinates
  const localPoint = pt.matrixTransform(svgElement.getScreenCTM().inverse());
  return {
    x: localPoint.x,
    y: localPoint.y,
  };
};

export default {
  getSvgCoords,
};
