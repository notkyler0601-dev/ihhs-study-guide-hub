import { ResponsiveSankey } from '@nivo/sankey';

interface Props {
  data: { nodes: { id: string }[]; links: { source: string; target: string; value: number }[] };
  height?: number;
  labelOrientation?: 'horizontal' | 'vertical';
}

export default function NivoSankey({ data, height = 520, labelOrientation = 'vertical' }: Props) {
  return (
    <div style={{ height, minWidth: 0 }}>
      <ResponsiveSankey
        data={data}
        margin={
          labelOrientation === 'vertical'
            ? { top: 80, right: 24, bottom: 80, left: 24 }
            : { top: 24, right: 200, bottom: 24, left: 160 }
        }
        align="justify"
        colors={{ scheme: 'red_purple' }}
        nodeOpacity={1}
        nodeHoverOpacity={1}
        nodeThickness={22}
        nodeSpacing={32}
        nodeBorderWidth={0}
        linkOpacity={0.55}
        linkHoverOpacity={0.9}
        linkContract={3}
        enableLinkGradient
        labelPosition="outside"
        labelOrientation={labelOrientation}
        labelPadding={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        theme={{
          labels: { text: { fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500 } },
          tooltip: { container: { fontSize: 12 } },
        }}
        animate
      />
    </div>
  );
}
