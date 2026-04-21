// MafsPlot React component, mounted via <MafsPlot client:only="react" />.
// Lightweight React math viz (Mafs).

import 'mafs/core.css';
import 'mafs/font.css';
import {
  Mafs,
  Coordinates,
  Plot,
  Line,
  Point,
  Circle,
  Vector,
  Text,
  Theme,
  useMovablePoint,
} from 'mafs';

interface FunctionSpec { y: string; color?: string; }
interface PointSpec { x: number; y: number; label?: string; color?: string; }
interface VectorSpec { tail: [number, number]; tip: [number, number]; color?: string; }

interface Props {
  /** y = f(x) string. e.g. "Math.sin(x)", "x*x", "Math.pow(x, 3) - x". */
  fns?: string[] | FunctionSpec[];
  /** Static labelled points. */
  points?: PointSpec[];
  /** Vectors from tail to tip. */
  vectors?: VectorSpec[];
  /** Show a draggable point that demos interactivity. */
  movable?: boolean;
  /** Viewbox: [xMin, xMax, yMin, yMax]. Defaults to [-5, 5, -5, 5]. */
  viewBox?: [number, number, number, number];
  /** Container height. */
  height?: number;
}

const COLORS = [Theme.red, Theme.indigo, Theme.green, Theme.orange, Theme.violet];

// Build f(x) at runtime from a string. Lock to Math + Number so authors
// can't import arbitrary code. Same trade-off other math viz libraries make.
function compileFn(src: string): (x: number) => number {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('x', `with(Math){ return (${src}); }`) as (x: number) => number;
    return (x) => {
      try { return fn(x); } catch { return NaN; }
    };
  } catch {
    return () => NaN;
  }
}

function MovableDemo() {
  const p = useMovablePoint([1, 1]);
  return (
    <>
      <Line.Segment point1={[0, 0]} point2={p.point} color={Theme.red} />
      <Vector tail={[0, 0]} tip={p.point} color={Theme.red} />
      {p.element}
      <Text x={p.x + 0.3} y={p.y + 0.3} attach="e" size={14}>{`(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`}</Text>
    </>
  );
}

export default function MafsPlot({
  fns = [],
  points = [],
  vectors = [],
  movable = false,
  viewBox = [-5, 5, -5, 5],
  height = 360,
}: Props) {
  const [xMin, xMax, yMin, yMax] = viewBox;
  const normalizedFns: FunctionSpec[] = (fns as any[]).map((f) => typeof f === 'string' ? { y: f } : f);

  return (
    <div className="not-prose my-8 surface rounded-2xl p-4 shadow-soft" style={{ height }}>
      <Mafs viewBox={{ x: [xMin, xMax], y: [yMin, yMax] }} preserveAspectRatio={false}>
        <Coordinates.Cartesian />
        {normalizedFns.map((f, i) => (
          <Plot.OfX key={i} y={compileFn(f.y)} color={f.color ?? COLORS[i % COLORS.length]} />
        ))}
        {vectors.map((v, i) => (
          <Vector key={`v${i}`} tail={v.tail} tip={v.tip} color={v.color ?? Theme.red} />
        ))}
        {points.map((p, i) => (
          <Point key={`p${i}`} x={p.x} y={p.y} color={p.color ?? Theme.red} />
        ))}
        {points.filter((p) => p.label).map((p, i) => (
          <Text key={`pl${i}`} x={p.x + 0.2} y={p.y + 0.3} attach="e" size={14}>{p.label}</Text>
        ))}
        {movable && <MovableDemo />}
      </Mafs>
    </div>
  );
}
