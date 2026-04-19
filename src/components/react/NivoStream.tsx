import { ResponsiveStream } from '@nivo/stream';

interface Props {
  keys: string[];
  data: Record<string, number>[];
  height?: number;
}

export default function NivoStream({ keys, data, height = 360 }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveStream
        data={data}
        keys={keys}
        margin={{ top: 30, right: 30, bottom: 60, left: 50 }}
        axisTop={null}
        axisRight={null}
        axisBottom={{ tickPadding: 5, tickRotation: 0, legend: '', legendOffset: 36 }}
        axisLeft={{ tickPadding: 5, tickRotation: 0 }}
        enableGridX
        enableGridY={false}
        offsetType="silhouette"
        order="reverse"
        colors={{ scheme: 'red_purple' }}
        fillOpacity={0.85}
        borderColor={{ theme: 'background' }}
        legends={[{
          anchor: 'bottom-right',
          direction: 'column',
          translateX: 100,
          itemWidth: 80,
          itemHeight: 20,
          itemTextColor: '#52525b',
          symbolSize: 12,
          symbolShape: 'circle',
        }]}
        animate
      />
    </div>
  );
}
