import { Group } from '@visx/group';
import { Circle } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { ParentSize } from '@visx/responsive';

interface Point { x: number; y: number; r?: number; label?: string; }
interface Props { data: Point[]; xLabel?: string; yLabel?: string; height?: number; }

export default function VisxScatter({ data, xLabel = '', yLabel = '', height = 360 }: Props) {
  return (
    <div style={{ width: '100%', height }}>
      <ParentSize>
        {({ width, height: h }) => {
          const margin = { top: 20, right: 20, bottom: 40, left: 50 };
          const innerW = width - margin.left - margin.right;
          const innerH = h - margin.top - margin.bottom;
          const xs = data.map((d) => d.x);
          const ys = data.map((d) => d.y);
          const xScale = scaleLinear({ domain: [Math.min(...xs), Math.max(...xs)], range: [0, innerW], nice: true });
          const yScale = scaleLinear({ domain: [Math.min(...ys), Math.max(...ys)], range: [innerH, 0], nice: true });
          return (
            <svg width={width} height={h}>
              <Group left={margin.left} top={margin.top}>
                <GridRows scale={yScale} width={innerW} stroke="#e4e4e7" />
                <GridColumns scale={xScale} height={innerH} stroke="#e4e4e7" />
                {data.map((d, i) => (
                  <Circle key={i} cx={xScale(d.x)} cy={yScale(d.y)} r={d.r ?? 5} fill="#b91c1c" fillOpacity={0.7} stroke="#7f1d1d" strokeWidth={1}>
                    {d.label && <title>{d.label}</title>}
                  </Circle>
                ))}
                <AxisLeft scale={yScale} label={yLabel} stroke="#71717a" tickStroke="#71717a" />
                <AxisBottom scale={xScale} top={innerH} label={xLabel} stroke="#71717a" tickStroke="#71717a" />
              </Group>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
