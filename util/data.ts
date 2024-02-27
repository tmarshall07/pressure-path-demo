export const normalCode = {
  lang: 'javascript',
  code: `// Get the coordinates at the current length
const svgPoint = pathObject.getPointAt(length);

// Find the tangent vector and angle at the current length
const tangentVector = pathObject.getTangentAt(length);
const tangentAngle = Math.atan2(tangentVector.y, tangentVector.x);

// Find the normal vector and angle at the current length
const normalVector = pathObject.getNormalAt(length);
const normalAngle = Math.atan2(normalVector.y, normalVector.x);

// The width (w) of the pressured stroke at the current length
const w = calcLinearPoint(strokeWidthProfile, length / pathLength) || 0;

// The proporation (p) of the current length to the total length
const p = length / pathLength;

// Calculate the end of the line extending from the current coordinates along
// the line to half the width (w) of the stroke in the direction of the normal vector (perpendicular to the path)
const nx = Math.cos(normalAngle) * (w / 2) * baseStrokeWidth;
const ny = Math.sin(normalAngle) * (w / 2) * baseStrokeWidth;
const { x, y } = svgPoint;`,
};

export const recursiveCode = {
  lang: 'javascript',
  code: ` // Get the previous normal point
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
}`,
};

export const createCurveCode = {
  lang: 'javascript',
  code: `// Mirror the previous path data to create the bottom of the path
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
pressurePathObject.arcTo(new window.paper.Point({ x: topStart.x + topStart.nx, y: topStart.y + topStart.ny }));`,
};
