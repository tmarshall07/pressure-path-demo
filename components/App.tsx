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

type Props = {};

const d =
  'M286.426 853.333c38.702-161.43 182.527-447.143 436.16-447.52 253.634-.377 240.348 201.911 460.054 202.141 181.32.189 288.27-174.592 299.93-309.486';

const baseStrokeColor = '#8ecae6';
const baseAccentColor = '#fb8500';

const App = (props: Props) => {
  const [step, setStep] = useState(0);
  const [strokeWidth, setStrokeWidth] = React.useState([200]);
  const [data, setData] = useState();
  const [strokePressure, setStrokePressure] = useState([
    [0, 0.1],
    [1, 1],
  ]);

  const updatePath = () => {
    window.paper.setup(new window.paper.Size(1000, 1000));
    const data = getPressurePath(d, strokePressure, strokeWidth[0]);

    console.log(data);
    setData(data);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.paper) {
      updatePath();
    }
  }, [strokeWidth, strokePressure]);

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
    <div className="w-full h-full">
      <Script src="/paper-full.js" onLoad={updatePath} />

      <div className="flex gap-10 sm:flex-row flex-col">
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

      <SvgViewer>{steps[step].component}</SvgViewer>

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
