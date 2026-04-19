import { ResponsiveSankey } from '@nivo/sankey';

interface Props {
  data: { nodes: { id: string }[]; links: { source: string; target: string; value: number }[] };
  height?: number;
}

export default function NivoSankey({ data, height = 420 }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveSankey
        data={data}
        margin={{ top: 20, right: 140, bottom: 20, left: 100 }}
        align="justify"
        colors={{ scheme: 'red_purple' }}
        nodeOpacity={1}
        nodeHoverOpacity={1}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        linkOpacity={0.5}
        linkHoverOpacity={0.85}
        linkContract={2}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.4]] }}
        animate
      />
    </div>
  );
}
