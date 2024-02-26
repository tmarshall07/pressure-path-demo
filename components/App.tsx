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
import { Eraser, Pen, PenTool, Pencil } from 'lucide-react';

const baseStrokeColor = '#8ecae6';
const baseAccentColor = '#fb8500';

enum ActiveTool {
  Pen = 'pen',
  Pencil = 'pencil',
}

const App = () => {
  const [d, setD] = useState('');
  const [step, setStep] = useState(0);
  const [strokeWidth, setStrokeWidth] = React.useState([200]);
  const [data, setData] = useState();
  const [strokePressure, setStrokePressure] = useState([
    [0, 0.1],
    [1, 1],
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>(ActiveTool.Pen);

  const pathData = dPathParse(d);

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

  const lines = data?.data.map((d, i) => (
    <line key={i} x1={d.x} x2={d.x + d.nx} y1={d.y} y2={d.y + d.ny} stroke="#ffb703" strokeWidth={2} />
  ));
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
    },
    {
      title: 'Base Path',
      description: 'The original path with a constant width.',
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
      component: (
        <>
          {transparentBasePath}
          {guideLine}
        </>
      ),
    },
    {
      title: 'Normal Lines',
      description:
        'Normal lines are drawn perpendicular to the path at each point along the line, with length determined by the pressure profile.',
      component: (
        <>
          {transparentBasePath}
          {guideLine}
          {lines}
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
    <div className="w-full h-full flex flex-col gap-5">
      <Script src="/paper-full.js" onLoad={updatePath} />

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
        className="bg-slate-900 rounded-lg"
        onMouseDown={activeTool === ActiveTool.Pen ? handlePenMouseDown : undefined}
        onMouseUp={activeTool === ActiveTool.Pen ? handlePenMouseUp : undefined}
        onMouseMove={activeTool === ActiveTool.Pen ? handlePenMouseMove : undefined}
      >
        {steps[step].component}
        {activeTool === ActiveTool.Pencil && <PencilPathEditor svgRef={svgRef} onFinishDraw={(newD) => setD(newD)} />}
        {activeTool === ActiveTool.Pen && <PenPathEditor d={d} />}
      </SvgViewer>

      <div className="flex flex-col gap-5">
        <div className="flex gap-5 justify-center">
          <Button variant="outline" className="w-[200px]" onClick={handlePrevious} disabled={step === 0}>
            Previous
          </Button>
          <Button variant="outline" className="w-[200px]" onClick={handleNext} disabled={step === steps.length - 1}>
            Next
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
