import { calcDistance, getLinearPressureFunction } from './index';

type Data = {
  p: number;
  nx: number;
  ny: number;
  x: number;
  y: number;
  t: number;
  n: number;
};

// Maximum difference allowed between adjacent tangent angles
const TANGENT_DIFFERENCE_MAX = 0.1;
const NORMAL_POINT_DISTANCE_MAX = 50;

/**
 * Get the data associated with the new pressure path
 */
export const getPathData = (
  pathObject: any,
  strokeWidthProfile: PressureProfile[],
  baseStrokeWidth: number,
): {
  pathData: Data[];
} => {
  // Get total length of base path
  const pathLength = pathObject.getLength();

  // Lengths contains all the points to evaluate along the path
  // starting with 0 and ending with the end of the path (i.e. the path length)
  const lengths = [0, pathLength];
  // Contains the actual data calculated at each point along the path
  const pathData: Data[] = [];

  // Get the linear pressure function from the stroke width profile (i.e. mx + b for the profile)
  const getWidthAtLength = getLinearPressureFunction(strokeWidthProfile);

  /**
   * Recursively evaluate data along the path (if greater than the max tangent difference)
   */
  const evaluatePathAtLength = (
    newData: Data[],
    newLengths: number[],
    length: number,
    previousData: Data,
  ): [Data[], number[]] => {
    let shouldAddPoint = !previousData;

    // Get the coordinates at the current length
    const svgPoint = pathObject.getPointAt(length);

    // Find the tangent vector and angle at the current length
    const tangentVector = pathObject.getTangentAt(length);
    const tangentAngle = Math.atan2(tangentVector.y, tangentVector.x);

    // Find the normal vector and angle at the current length
    const normalVector = pathObject.getNormalAt(length);
    const normalAngle = Math.atan2(normalVector.y, normalVector.x);

    // The proportional width (w) of the pressured stroke at the current length (number between 0 and 1)
    const w = getWidthAtLength(length / pathLength) || 0;

    // The proporation (p) of the current length to the total length
    const p = length / pathLength;

    // Calculate the end of the line extending from the current coordinates along
    // the line to half the width (w) of the stroke in the direction of the normal vector (perpendicular to the path)
    const nx = Math.cos(normalAngle) * (w / 2) * baseStrokeWidth;
    const ny = Math.sin(normalAngle) * (w / 2) * baseStrokeWidth;
    const { x, y } = svgPoint;

    // Determine if we need to add more points between this and the previous point
    if (previousData && previousData.t && previousData.p * pathLength > -1) {
      // Get the previous normal point
      const previousNp = {
        x: previousData.x + previousData.nx,
        y: previousData.y + previousData.ny,
      };

      // Get the previous length
      const previousLength = previousData.p * pathLength;
      // Calculate the difference between the current tangent angle and the previous tangent angle
      const tangentDifference = Math.abs(tangentAngle - previousData.t);
      // Calculate the difference between the current normal point and the previous normal point
      const normalPointDistance = calcDistance(previousNp.x, previousNp.y, x + nx, y + ny);

      // If the distance between adjacent normal points is too large
      // OR if the difference between adjacent tangent angles is too large (i.e. the path is too sharp)
      // then we add another point to evaluate between the current two points
      if (normalPointDistance > NORMAL_POINT_DISTANCE_MAX || tangentDifference > TANGENT_DIFFERENCE_MAX) {
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

  // Evaluate the path at each length, this loop will grow the lengths array
  // and therefore continue to run until enough points have been calculated
  for (let i = 0; i < lengths.length; i += 1) {
    const [newPathData, newLengths] = evaluatePathAtLength([], [lengths[i]], lengths[i], pathData[i - 1]);

    // Remove repeats
    if (i > 1) {
      newLengths.pop();
      newPathData.pop();
    }

    lengths.splice(i, 0, ...newLengths);
    pathData.splice(i, 0, ...newPathData);

    // Sanity check to prevent infinite loops, probably
    // want to revisit this to make it more robust
    if (i > 10000) break;
  }

  return { pathData };
};

type PressureProfile = [number, number];

/**
 * Generates a path that has a pressure profile applied to it
 */
export const getPressurePath = (d: string, strokeWidthProfile: PressureProfile[], baseStrokeWidth: number) => {
  // use the paper library utilities to create a path from the passed d (definition) attribute
  const pathObject = new window.paper.Path({});
  pathObject.setPathData(d);

  // Retrieve the pressure profile from the stroke width profile and base stroke width
  const { pathData } = getPathData(pathObject, strokeWidthProfile, baseStrokeWidth);

  // Mirror the previous path data to create the bottom of the path
  const bottomPathData = pathData
    .map((data) => ({
      ...data,
      nx: -data.nx,
      ny: -data.ny,
    }))
    .reverse();

  const topStart = pathData[0];
  const bottomStart = bottomPathData[0];

  // Add the top of the new window.paper.Path
  const pressurePathObject = new window.paper.Path({
    segments: [...pathData.map((p) => new window.paper.Point({ x: p.x + p.nx, y: p.y + p.ny }))],
  });

  // Smooth / simplify the curve
  pressurePathObject.simplify();
  // Arc to the bottom
  pressurePathObject.arcTo(
    new window.paper.Point({
      x: bottomStart.x + bottomStart.nx,
      y: bottomStart.y + bottomStart.ny,
    }),
  );

  // Create the bottom path separately
  const bottomPressurePathObject = new window.paper.Path({
    segments: [...bottomPathData.map((p) => new window.paper.Point({ x: p.x + p.nx, y: p.y + p.ny }))],
  });
  // Simplify before connecting to the top (simplify / smooth makes the arc wonky)
  bottomPressurePathObject.simplify();

  // Combine the top and bottom
  pressurePathObject.addSegments(bottomPressurePathObject.segments);
  // Arc to connect to the beginning
  pressurePathObject.arcTo(new window.paper.Point({ x: topStart.x + topStart.nx, y: topStart.y + topStart.ny }));

  return { path: pressurePathObject, data: [...pathData, ...bottomPathData] };
};
