import { Point, Path } from 'paper';
import { CommandProps } from '../../types/DPathParse';

import { calcLinearPoint } from './path';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace paper {
    export interface Path {
      setPathData: (d: string) => void;
      getPathData: () => void;
    }
  }
}

type TransformProps = {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
};

/**
 * Get the distance between two points
 *
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 */
export const calcDistance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));

export const A = (rx: number, ry: number, ex: number, ey: number, rotation = 0, arc = 0, sweep = 1): string =>
  ` A${Math.round(rx)},${Math.round(ry)} ${rotation}, ${arc}, ${sweep}, ${Math.round(ex)}, ${Math.round(ey)}`;

/**
 * Get the M command for a path (start)
 *
 * @param {Number} x
 * @param {Number} y
 * @returns {String}
 */
export const M = (x: number, y: number): string => ` M${Math.round(x)},${Math.round(y)}`;

export const S = (cpx2: number, cpy2: number, ex: number, ey: number): string =>
  ` S${Math.round(cpx2)},${Math.round(cpy2)} ${Math.round(ex)},${Math.round(ey)}`;

export const C = (cpx1: number, cpy1: number, cpx2: number, cpy2: number, ex: number, ey: number): string =>
  ` C${Math.round(cpx1)},${Math.round(cpy1)} ${Math.round(cpx2)},${Math.round(
    cpy2,
  )} ${Math.round(ex)},${Math.round(ey)}`;

export const L = (ex: number, ey: number): string => ` L${Math.round(ex)},${Math.round(ey)}`;

export const mirrorCp = (cpx: number, cpy: number, x: number, y: number): { x: number; y: number } => ({
  x: Math.round(2 * x - cpx),
  y: Math.round(2 * y - cpy),
});

export const getDString = (parsedPath: CommandProps[]): string => {
  const d = parsedPath.reduce((dString, command) => {
    let newDString = dString;
    switch (command.code.toLowerCase()) {
      case 'c':
        newDString += C(command.cp1.x, command.cp1.y, command.cp2.x, command.cp2.y, command.end.x, command.end.y);
        break;
      case 'm':
        newDString += M(command.end.x, command.end.y);
        break;
      default:
        break;
    }
    return newDString;
  }, '');

  return d.trim();
};

export const getTangentAtLength = (length: number, pathEl: SVGPathElement): number => {
  const p1 = pathEl.getPointAtLength(length - 1);
  const p2 = pathEl.getPointAtLength(length + 1);
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  return angle;
};

type Data = {
  p: number;
  nx: number;
  ny: number;
  x: number;
  y: number;
  t: number;
  n: number;
};

/**
 *
 *
 * @param {HTMLElement} pathEl - a path element
 * @param {[{ x: {Number}, y: {Number} }]} strokeWidthProfile - array of numbers that correspond to stroke-widths
 * @param {Number} baseStrokeWidth - maximum absolute stroke width in pixels
 * @returns
 */
export const getPathData = (
  paperPath: any,
  strokeWidthProfile: PressureProfile[],
  baseStrokeWidth: number,
): {
  pathData: Data[];
} => {
  const pathLength = paperPath.getLength();

  const lengths = [0, pathLength];
  const pathData: Data[] = [];

  // Maximum difference allowed between adjacent tangent angles
  const tangentDifferenceMax = 0.1;
  const normalPointDistanceMax = 50;

  /**
   * Recursively evaluate data along the path (if greater than the max tangent difference)
   *
   * @param {Array} data - the working pathData array
   * @param {Number} length - the length in pixels along the path to evaluate
   */
  const evaluatePathAtLength = (
    newData: Data[],
    newLengths: number[],
    length: number,
    previousData: Data,
  ): [Data[], number[]] => {
    let shouldAddPoint = !previousData;
    const svgPoint = paperPath.getPointAt(length);

    const tangentVector = paperPath.getTangentAt(length);
    const tangentAngle = Math.atan2(tangentVector.y, tangentVector.x);

    const normalVector = paperPath.getNormalAt(length);
    const normalAngle = Math.atan2(normalVector.y, normalVector.x);

    const w = calcLinearPoint(strokeWidthProfile, length / pathLength) || 0;

    const p = length / pathLength;
    const nx = Math.cos(normalAngle) * (w / 2) * baseStrokeWidth;
    const ny = Math.sin(normalAngle) * (w / 2) * baseStrokeWidth;
    const { x, y } = svgPoint;

    if (previousData && previousData.t && previousData.p * pathLength > -1) {
      const previousNp = {
        x: previousData.x + previousData.nx,
        y: previousData.y + previousData.ny,
      };

      const previousLength = previousData.p * pathLength;
      const tangentDifference = Math.abs(tangentAngle - previousData.t);
      const normalPointDistance = calcDistance(previousNp.x, previousNp.y, x + nx, y + ny);

      if (normalPointDistance > normalPointDistanceMax || tangentDifference > tangentDifferenceMax) {
        newLengths.unshift((previousLength + length) / 2);
        shouldAddPoint = true;

        // Adjacent points are too different, add in another point between this and the previous point
        evaluatePathAtLength(newData, newLengths, (previousLength + length) / 2, previousData);
      } else {
        // Splices out the previous test length
        newLengths.splice(0, 1);
      }
    } else {
      newLengths.splice(0, 1);
    }

    if (shouldAddPoint) {
      newData.push({
        p,
        nx,
        ny,
        x,
        y,
        t: tangentAngle,
        n: normalAngle,
      });
    }

    return [newData, newLengths];
  };

  for (let i = 0; i < lengths.length; i += 1) {
    const [newPathData, newLengths] = evaluatePathAtLength([], [lengths[i]], lengths[i], pathData[i - 1]);

    // Remove repeats
    if (i > 1) {
      newLengths.pop();
      newPathData.pop();
    }

    lengths.splice(i, 0, ...newLengths);
    pathData.splice(i, 0, ...newPathData);

    if (i > 10000) break; // Sanity check
  }

  return { pathData };
};

type PressureProfile = [number, number];

/**
 * Generates a path that has a pressure profile applied to it
 *
 * @param {String} d
 * @param {[{ x: {Number}, y: {Number} }]} strokeWidthProfile - array of numbers that correspond to stroke-widths
 * @param {Number} baseStrokeWidth - the base stroke width without any pressure profile
 * @returns
 */
export const getPressurePath = (d: string, strokeWidthProfile: PressureProfile[], baseStrokeWidth: number) => {
  const paperPath = new window.paper.Path({});
  paperPath.setPathData(d);

  const { pathData } = getPathData(paperPath, strokeWidthProfile, baseStrokeWidth);

  const bottomPathData = pathData
    .map((data) => ({
      ...data,
      nx: -data.nx,
      ny: -data.ny,
    }))
    .reverse();

  const topStart = pathData[0];
  const bottomStart = bottomPathData[0];

  // Add the top of the new path
  const path = new window.paper.Path({
    segments: [...pathData.map((p) => new window.paper.Point({ x: p.x + p.nx, y: p.y + p.ny }))],
  });

  // Smooth / simplify the curve
  path.simplify();
  // Arc to the bottom
  path.arcTo(
    new window.paper.Point({
      x: bottomStart.x + bottomStart.nx,
      y: bottomStart.y + bottomStart.ny,
    }),
  );

  // Create the bottom path separately
  const bottomPath = new window.paper.Path({
    segments: [...bottomPathData.map((p) => new window.paper.Point({ x: p.x + p.nx, y: p.y + p.ny }))],
  });
  // Simplify before connecting to the top (simplify / smooth makes the arc wonky)
  bottomPath.simplify();

  // Combine the top and bottom
  path.addSegments(bottomPath.segments);
  // Arc to connect to the beginning
  path.arcTo(new window.paper.Point({ x: topStart.x + topStart.nx, y: topStart.y + topStart.ny }));

  return { path, data: [...pathData, ...bottomPathData] };
};

/**
 * Scales the given points depending on the element's scaleX and scaleY attributes
 *
 * @param {Number} x
 * @param {Number} y
 * @returns {Object}
 * {
 *  x: Number,
 *  y: Number,
 * }
 * @memberof PathElement
 */
export const scalePoints = (x: number, y: number, transform?: TransformProps): { x: number; y: number } => {
  let newX = x;
  let newY = y;

  if (transform?.scaleX) {
    newX /= transform.scaleX;
  }

  if (transform?.scaleY) {
    newY /= transform.scaleY;
  }

  return { x: newX, y: newY };
};

/**
 * Translates a node accounting for scale
 *
 * @param {Number} x - new absolute x position
 * @param {Number} y - new absolute y position
 * @returns {Object}
 * {
 *   x: Number, new x position
 *   y: Number, new y position
 * }
 * @memberof PathElement
 */
export const translatePoints = (
  x: number,
  y: number,
  transform?: TransformProps,
): {
  x: number;
  y: number;
} => {
  let newX = x;
  let newY = y;
  if (transform?.translateX) {
    newX -= transform.translateX;
  }

  if (transform?.translateY) {
    newY -= transform.translateY;
  }

  const scaledPoints = scalePoints(newX, newY, transform);
  newX = scaledPoints.x;
  newY = scaledPoints.y;

  return { x: newX, y: newY };
};

/**
 *
 *
 * @param {{ x: Number, y: Number }} coords
 * @param {Object} parsedPath - a parsed path array from dPathParse
 * @param {{ cpx: Number, cpy: Number }} initialCp
 * @memberof PathElement
 */
export const addPoint = (
  coords: { x: number; y: number },
  parsedPath: CommandProps[],
  initialCp?: { cpx: number; cpy: number },
  transform?: TransformProps,
) => {
  const { x, y } = translatePoints(coords.x, coords.y, transform);

  const lastCommand = parsedPath[parsedPath.length - 1];

  let newCommand = '';
  if (lastCommand && lastCommand.cp2) {
    const mirroredCp = mirrorCp(lastCommand.cp2.x, lastCommand.cp2.y, lastCommand.end.x, lastCommand.end.y);
    newCommand = C(mirroredCp.x, mirroredCp.y, x, y, x, y);
  } else if (initialCp) {
    // Use the initial control point if one was passed
    newCommand = C(initialCp.cpx, initialCp.cpy, x, y, x, y);
  } else {
    // Otherwise the last command is the start of the path (and doesn't have any control points)
    newCommand = C(lastCommand.end.x, lastCommand.end.y, x, y, x, y);
  }

  return newCommand;
};

export const translateNode = (
  parsedPath: CommandProps[],
  nodeIndex: number,
  dx: number,
  dy: number,
  transform?: TransformProps,
): CommandProps[] => {
  const node = parsedPath[nodeIndex];

  const scaled = scalePoints(dx, dy, transform);
  const newDx = scaled.x;
  const newDy = scaled.y;

  // Translate node
  node.end.x += newDx;
  node.end.y += newDy;

  // Translate this node's second control point
  if (node.code === 'C') {
    node.cp2.x += newDx;
    node.cp2.y += newDy;
  }

  // Translate next node's first control point
  const nextNode = parsedPath[nodeIndex + 1];
  if (nextNode) {
    nextNode.cp1.x += newDx;
    nextNode.cp1.y += newDy;
  }

  return parsedPath;
};

export const translateControlPoints = (
  coords: { x: number; y: number },
  parsedPath: CommandProps[],
  commandIndex: number,
  transform: TransformProps,
  mirror = false,
): CommandProps[] => {
  const newParsedPath = [...parsedPath];
  const { x, y } = translatePoints(coords.x, coords.y, transform);

  const command = parsedPath[commandIndex];

  const newCp2 = { x: Math.round(x), y: Math.round(y) };
  const mirroredCp2 = mirrorCp(newCp2.x, newCp2.y, command.end.x, command.end.y);

  newParsedPath[commandIndex] = {
    ...command,
    cp2: mirror ? mirroredCp2 : newCp2, // Use mirrored CP2, otherwise dragging seems opposite of convention
  };

  const nextCommand = newParsedPath[commandIndex + 1];
  if (nextCommand) {
    newParsedPath[commandIndex + 1] = {
      ...nextCommand,
      cp1: mirror ? newCp2 : mirroredCp2,
    };
  }

  return newParsedPath;
};

export default {
  calcDistance,
  A,
  M,
  S,
  C,
  L,
  mirrorCp,
  getDString,
  getTangentAtLength,
  getPathData,
  getPressurePath,
  addPoint,
  translatePoints,
  translateControlPoints,
  translateNode,
  scalePoints,
};
