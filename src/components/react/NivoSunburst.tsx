import { ResponsiveSunburst } from '@nivo/sunburst';

interface Node { id: string; value?: number; children?: Node[]; }
interface Props { data: Node; height?: number; }

export default function NivoSunburst({ data, height = 460 }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveSunburst
        data={data}
        margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
        id="id"
        value="value"
        cornerRadius={2}
        borderColor="#fff"
        borderWidth={2}
        colors={{ scheme: 'red_purple' }}
        childColor={{ from: 'color', modifiers: [['brighter', 0.2]] }}
        enableArcLabels
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 1.4]] }}
        animate
      />
    </div>
  );
}
