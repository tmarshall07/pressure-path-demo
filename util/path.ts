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
 * Get the distance between two points
 *
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 */
export const calcDistance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));

/**
 * Calculate a point along the profile
 *
 * @param {Array} strokeWidthProfile
 * @param {Number} length
 * @returns
 */

type Point = [number, number];

export const calcLinearPoint = (strokeWidthProfile: Point[], length: number): number | null => {
  let width = null;
  strokeWidthProfile.forEach((point, i) => {
    if (i > 0) {
      const x1 = strokeWidthProfile[i - 1][0];
      const y1 = strokeWidthProfile[i - 1][1];
      const x2 = point[0];
      const y2 = point[1];
      // TODO: MIGHT BE TROUBLE HERE WITH CHECK
      if (length <= x2) {
        const m = (y2 - y1) / (x2 - x1);
        const b = y2 - m * x2;
        width = length * m + b;
      }
    }
  });

  return width;
};

// Maximum difference allowed between adjacent tangent angles
const TANGENT_DIFFERENCE_MAX = 0.1;
const NORMAL_POINT_DISTANCE_MAX = 50;

/**
 * Get the data associated with the new pressure path
 */
export const getPathData = (
  paperPath: any,
  strokeWidthProfile: PressureProfile[],
  baseStrokeWidth: number,
): {
  pathData: Data[];
} => {
  // Get total length of base path
  const pathLength = paperPath.getLength();

  // Lengths contains all the points to evaluate along the path
  // starting with 0 and ending with the end of the path (i.e. the path length)
  const lengths = [0, pathLength];
  // Contains the actual data calculated at each point along the path
  const pathData: Data[] = [];

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
    const svgPoint = paperPath.getPointAt(length);

    // Find the tangent vector and angle at the current length
    const tangentVector = paperPath.getTangentAt(length);
    const tangentAngle = Math.atan2(tangentVector.y, tangentVector.x);

    // Find the normal vector and angle at the current length
    const normalVector = paperPath.getNormalAt(length);
    const normalAngle = Math.atan2(normalVector.y, normalVector.x);

    // The width (w) of the pressured stroke at the current length
    const w = calcLinearPoint(strokeWidthProfile, length / pathLength) || 0;

    // The proporation (p) of the current length to the total length
    const p = length / pathLength;

    // Calculate the end of the line extending from the current coordinates along
    // the line to half the width (w) of the stroke in the direction of the normal vector (perpendicular to the path)
    const nx = Math.cos(normalAngle) * (w / 2) * baseStrokeWidth;
    const ny = Math.sin(normalAngle) * (w / 2) * baseStrokeWidth;
    const { x, y } = svgPoint;

    // Determine if we need to add more points between this and the previous point
    if (previousData && previousData.t && previousData.p * pathLength > -1) {
      const previousNp = {
        x: previousData.x + previousData.nx,
        y: previousData.y + previousData.ny,
      };

      const previousLength = previousData.p * pathLength;
      const tangentDifference = Math.abs(tangentAngle - previousData.t);
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
  const paperPath = new window.paper.Path({});
  paperPath.setPathData(d);

  // Retrieve the pressure profile from the stroke width profile and base stroke width
  const { pathData } = getPathData(paperPath, strokeWidthProfile, baseStrokeWidth);

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
