'use client';

import React, { useEffect, useState } from 'react';
import SvgViewer from './SvgViewer';
import Script from 'next/script';
import { getPressurePath } from '@/util/path';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { transparentize } from 'polished';
import PressureCurvePicker from './PressureCurvePicker';
import PencilPathEditor from './PencilPathEditor';
import PenPathEditor from './PenPathEditor';
import dPathParse from 'd-path-parser';
import { addPoint, getDString, translateControlPoints } from '@/util';
import { getSvgCoords } from '@/util/coords';
import { ChevronLeft, ChevronRight, Eraser, Pen, PenTool, Pencil } from 'lucide-react';
import Code from './code/Code';
import { normalCode, recursiveCode } from '@/util/data';

const connectPoints = (pathData = []) => {
  if (typeof window !== 'undefined' && window.paper) {
    const path = new window.paper.Path({
      segments: [...pathData.map((p) => new window.paper.Point({ x: p.x + p.nx, y: p.y + p.ny }))],
    });
    return path.getPathData();
  }

  return '';
};

const baseStrokeColor = '#8ecae6';
const baseAccentColor = '#fb8500';
const baseAccent2Color = '#ffb703';

enum ActiveTool {
  Pen = 'pen',
  Pencil = 'pencil',
}

const App = () => {
  const [d, setD] = useState(
    'M286.426 853.333c38.702-161.43 182.527-447.143 436.16-447.52 253.634-.377 240.348 201.911 460.054 202.141 181.32.189 288.27-174.592 299.93-309.486',
  );
  const [pencilD, setPencilD] = useState('');
  const [step, setStep] = useState(0);
  const [strokeWidth, setStrokeWidth] = React.useState([200]);
  const [data, setData] = useState();
  const [strokePressure, setStrokePressure] = useState([
    [0, 0.5],
    [1, 1],
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>();

  const pathData = dPathParse(d);
  const pencilPathData = dPathParse(pencilD);

  const svgRef = React.createRef<SVGSVGElement>();

  const handleReset = () => {
    setData(undefined);
    setD('');
  };

  const handleSetTool = (tool: ActiveTool) => {
    handleReset();
    setActiveTool(tool);
  };

  const updatePath = () => {
    window.paper.setup(new window.paper.Size(1000, 1000));

    if (pathData.length > 1) {
      const data = getPressurePath(d, strokePressure, strokeWidth[0]);

      setData(data);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.paper) {
      console.log(svgRef.current);
      updatePath();
    }
  }, [strokeWidth, strokePressure, d]);

  const handlePenMouseDown = (e) => {
    setIsDragging(true);

    if (svgRef.current) {
      const coords = getSvgCoords(svgRef.current, e);

      if (pathData.length === 0) {
        const newCommand = `M${coords.x},${coords.y}`;
        setD(newCommand);
      } else {
        const newCommand = addPoint(coords, pathData);

        // Update
        const newD = d + newCommand;
        setD(newD);
      }
    }
  };

  const handlePenMouseMove = (e) => {
    if (isDragging && svgRef.current) {
      if (pathData.length > 0) {
        const mirror = true;

        const newCoords = getSvgCoords(svgRef.current, e);
        const newParsedPath = translateControlPoints(
          newCoords,
          pathData,
          pathData.length - 1,
          { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 },
          mirror,
        );

        // Update
        const newD = getDString(newParsedPath);
        setD(newD);
        console.log(newD);
      }
    }
  };

  const handlePenMouseUp = () => {
    setIsDragging(false);
  };

  const handlePencilMouseMove = (e) => {
    if (isDragging) {
      // Add point to path
      const coords = getSvgCoords(svgRef.current, e);
      const newCommand = addPoint(coords, pencilPathData);

      // Update
      const newD = pencilD + newCommand;
      setPencilD(newD);
    }
  };

  const handlePencilMouseDown = (e) => {
    setIsDragging(true);

    const coords = getSvgCoords(svgRef.current, e);
    const newCommand = `M${coords.x},${coords.y}`;
    setPencilD(newCommand);
  };

  const handlePencilMouseUp = (e) => {
    setIsDragging(false);

    const path = new window.paper.Path(pencilD);
    const newD = path.getPathData();

    // Simplify the path
    path.simplify(200);

    setD(newD);
    setPencilD('');
  };

  let upHandler, moveHandler, downHandler;
  if (activeTool === ActiveTool.Pen) {
    upHandler = handlePenMouseUp;
    moveHandler = handlePenMouseMove;
    downHandler = handlePenMouseDown;
  } else if (activeTool === ActiveTool.Pencil) {
    upHandler = handlePencilMouseUp;
    moveHandler = handlePencilMouseMove;
    downHandler = handlePencilMouseDown;
  }

  const lines =
    data?.data.map((d, i) => (
      <line key={i} x1={d.x} x2={d.x + d.nx} y1={d.y} y2={d.y + d.ny} stroke={baseAccent2Color} strokeWidth={3} />
    )) || [];

  const points = data?.data.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={10} fill={baseAccent2Color} />);

  const transparentBasePath = (
    <path
      d={d}
      style={{
        fill: 'none',
        strokeWidth: strokeWidth[0],
        stroke: transparentize(0.9, baseStrokeColor),
      }}
    />
  );
  const outline = data?.path.getPathData();

  const variablePath = <path d={outline} style={{ fill: baseAccentColor, stroke: 'none', strokeWidth: 2 }} />;

  const guideLine = (
    <path
      d={d}
      style={{
        fill: 'none',
        strokeWidth: 1,
        stroke: baseAccentColor,
      }}
    />
  );

  const steps = [
    {
      title: 'Path with Variable Width',
      component: variablePath,
      description: 'The desired path with a variable width that corresponds to the "pressure profile."',
      code: (
        <Code
          lang="tsx"
          code={`<path
  style={{
    fill: '${baseAccentColor}',
    stroke: 'none',
  }}
  d="${outline}"
/>`}
        />
      ),
    },
    {
      title: 'Base Path',
      description: 'The original path with a constant width.',
      code: (
        <Code
          lang="tsx"
          code={`<path
  style={{
    fill: '${baseStrokeColor}',
    strokeWidth: ${strokeWidth[0]},
  }}
  d="${d}"
/>`}
        />
      ),
      component: (
        <path
          d={d}
          style={{
            fill: 'none',
            strokeWidth: strokeWidth[0],
            stroke: baseStrokeColor,
          }}
        />
      ),
    },
    {
      title: 'Transparent Base Path',
      description: 'The original path with a constant width and a transparent fill to show the center line.',
      code: (
        <Code
          lang="tsx"
          code={`<path
  style={{
    fill: 'none',
    strokeWidth: 1,
    stroke: "${baseAccentColor}",
  }}
  d="${d}"
/>`}
        />
      ),
      component: (
        <>
          {transparentBasePath}
          {guideLine}
        </>
      ),
    },
    {
      title: 'Normal Lines',
      description: 'Normal lines are drawn perpendicular to the path at the start and end of the path.',
      code: <Code {...normalCode} />,
      component: (
        <>
          {transparentBasePath}
          {guideLine}
          {points?.[0]}
          {lines?.[0]}
          {points?.[lines.length / 2 - 1]}
          {lines?.[lines.length / 2 - 1]}
        </>
      ),
    },
    {
      title: 'Normal Lines',
      description: 'Normal lines drawn close enough together to yield a nearly smooth curve that fits the path.',
      code: <Code {...normalCode} />,
      component: (
        <>
          {transparentBasePath}
          {guideLine}
          {points?.[0]}
          {lines?.[0]}
          {points?.[lines.length / 2 - 1]}
          {lines?.[lines.length / 2 - 1]}
          <line
            x1={data?.data[0]?.x + data?.data[0]?.nx}
            x2={data?.data[data?.data.length / 2 - 1]?.x + data?.data[data?.data.length / 2 - 1]?.nx}
            y1={data?.data[0]?.y + data?.data[0]?.ny}
            y2={data?.data[data?.data.length / 2 - 1]?.y + data?.data[data?.data.length / 2 - 1]?.ny}
            stroke={baseAccentColor}
            strokeWidth={2}
          />
        </>
      ),
    },
    {
      title: 'Recursively Add Normal Lines',
      description:
        'Additional normal lines are added recursively to create a more accurate representation of the variable width path.',
      code: <Code {...recursiveCode} />,
      component: (
        <>
          {transparentBasePath}
          {guideLine}
          {lines.slice(0, lines.length / 2)}
        </>
      ),
    },
    {
      title: 'Connect Normal Lines',
      description: 'Now the connected normal lines fit the curve of the path.',
      code: <Code {...recursiveCode} />,
      component: (
        <>
          {transparentBasePath}
          {guideLine}
          {lines.slice(0, lines.length / 2)}
          {
            <path
              d={connectPoints(data?.data.slice(0, lines.length / 2))}
              stroke={baseAccentColor}
              strokeWidth={2}
              fill="none"
            />
          }
        </>
      ),
    },
    {
      title: 'Outline',
      description: 'Lines are drawn to connect the ends of the normal lines to create a closed path.',
      component: (
        <>
          {transparentBasePath}
          {guideLine}
          {lines}
          {<path d={outline} style={{ fill: 'none', stroke: baseAccentColor, strokeWidth: 2 }} />}
        </>
      ),
    },
    {
      title: 'Path with Variable Width',
      description: 'The final variable width line with the original path in the background.',
      component: (
        <>
          {transparentBasePath}
          {variablePath}
        </>
      ),
    },
  ];

  const handleNext = () => {
    const newStep = step + 1;
    if (steps.length > newStep) {
      setStep(newStep);
    }
  };

  const handlePrevious = () => {
    const newStep = step - 1;
    if (newStep >= 0) {
      setStep(newStep);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-5 m-auto">
      <Script src="/paper-full.js" onLoad={updatePath} />

      <div className="flex gap-5 h-full">
        <div className="flex-1 flex flex-col">
          <div className="flex gap-10 sm:flex-row flex-col">
            <div className="flex gap-3">
              <Button
                size="icon"
                variant={activeTool === ActiveTool.Pen ? 'default' : 'outline'}
                onClick={() => handleSetTool(ActiveTool.Pen)}
              >
                <PenTool />
              </Button>
              <Button
                size="icon"
                variant={activeTool === ActiveTool.Pencil ? 'default' : 'outline'}
                onClick={() => handleSetTool(ActiveTool.Pencil)}
              >
                <Pencil />
              </Button>
              <Button size="icon" variant="outline">
                <Eraser onClick={handleReset} />
              </Button>
            </div>
            <div className="flex-1">
              <div>Stroke width</div>
              <div className="flex gap-5">
                <Slider
                  value={strokeWidth}
                  onValueChange={(value) => {
                    setStrokeWidth(value);
                  }}
                  max={300}
                  min={1}
                  step={1}
                  className={cn('w-[60%] flex-1')}
                />
                <div className="p-5 bg-slate-800 rounded-lg">{strokeWidth[0]}</div>
              </div>
            </div>

            <div className="w-[150px]">
              <div>Stroke pressure</div>
              <PressureCurvePicker points={strokePressure} setPoints={setStrokePressure} />
            </div>
          </div>

          <SvgViewer
            ref={svgRef}
            className="bg-slate-900 rounded-lg h-[600px]"
            onMouseDown={downHandler}
            onMouseUp={upHandler}
            onMouseMove={moveHandler}
          >
            {steps[step].component}
            {activeTool === ActiveTool.Pencil && <PencilPathEditor d={pencilD} />}
            {activeTool === ActiveTool.Pen && <PenPathEditor d={d} />}
          </SvgViewer>
        </div>

        <div className="w-[550px]">
          <div className="p-5 rounded-lg h-full">
            <h3 className="text-lg text-slate-500">Code</h3>
            {steps[step].code && steps[step].code}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex gap-5 justify-center">
          <Button variant="outline" className="w-[200px]" onClick={handlePrevious} disabled={step === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" className="w-[200px]" onClick={handleNext} disabled={step === steps.length - 1}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-2 max-w-lg m-auto">
          <h3 className="text-lg text-center">
            {[step + 1]}. {steps[step].title}
          </h3>
          <p className="text-center text-slate-500">{steps[step].description}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
