import { ResponsiveChord } from '@nivo/chord';

interface Props {
  keys: string[];
  matrix: number[][];
  height?: number;
}

export default function NivoChord({ keys, matrix, height = 460 }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveChord
        data={matrix}
        keys={keys}
        margin={{ top: 60, right: 60, bottom: 60, left: 60 }}
        valueFormat=".2f"
        padAngle={0.02}
        innerRadiusRatio={0.96}
        innerRadiusOffset={0.02}
        inactiveArcOpacity={0.25}
        arcBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        activeRibbonOpacity={0.85}
        inactiveRibbonOpacity={0.15}
        ribbonBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        labelOffset={12}
        labelRotation={-90}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
        colors={{ scheme: 'red_purple' }}
        motionConfig="gentle"
        animate
      />
    </div>
  );
}
