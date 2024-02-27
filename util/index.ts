import { Point, Path } from 'paper';
import { CommandProps } from '../../types/DPathParse';

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

export type Point = [number, number];

export const getLinearPressureFunction = (strokeWidthProfile: Point[]): ((length: number) => number) => {
  if (strokeWidthProfile.length > 1) {
    const [x1, y1] = strokeWidthProfile[0];
    const [x2, y2] = strokeWidthProfile[1];
    const m = (y2 - y1) / (x2 - x1);
    const b = y2 - m * x2;

    const linearFunction = (length: number) => length * m + b;

    return linearFunction;
  }

  return () => 0;
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
  addPoint,
  translatePoints,
  translateControlPoints,
  translateNode,
  scalePoints,
};
