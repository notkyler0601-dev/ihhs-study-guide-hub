import { ResponsiveSunburst } from '@nivo/sunburst';

interface InputNode {
  id?: string;
  name?: string;
  value?: number;
  color?: string;
  children?: InputNode[];
}
interface Props { data: InputNode; height?: number; }

// Fixed categorical order, validated (light + dark) with the palette checker.
// Branch nodes without an explicit `color` are assigned from this list in order.
const FALLBACK = ['#b91c1c', '#1d4ed8', '#d97706', '#0d9488', '#7c3aed', '#be185d', '#4d7c0f'];

interface CleanNode {
  id: string;
  value?: number;
  color?: string;
  children?: CleanNode[];
}

// Guides author nodes as { name, color, children } (matching MindMap et al).
// Nivo wants { id } and a color on every top-level branch, so normalize.
function normalize(node: InputNode, depth: number, index: number): CleanNode {
  const clean: CleanNode = { id: node.id ?? node.name ?? `node-${depth}-${index}` };
  if (node.value != null) clean.value = node.value;
  const color = node.color ?? (depth === 1 ? FALLBACK[index % FALLBACK.length] : undefined);
  if (color) clean.color = color;
  if (node.children?.length) {
    clean.children = node.children.map((c, i) => normalize(c, depth + 1, i));
  }
  return clean;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function NivoSunburst({ data, height = 460 }: Props) {
  const clean = normalize(data, 0, 0);
  return (
    <div style={{ height }}>
      <ResponsiveSunburst
        data={clean}
        margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
        id="id"
        value="value"
        cornerRadius={2}
        borderColor="#fff"
        borderWidth={2}
        colors={{ datum: 'data.color' }}
        childColor={{ from: 'color', modifiers: [['brighter', 0.25]] }}
        enableArcLabels
        arcLabel={(d) => String(d.id)}
        arcLabelsSkipAngle={14}
        arcLabelsTextColor={(d) => (luminance(String(d.color)) > 0.55 ? '#1c1917' : '#ffffff')}
        tooltip={({ id }) => (
          <div
            style={{
              background: '#1c1917',
              color: '#fafaf9',
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            {String(id)}
          </div>
        )}
        animate
      />
    </div>
  );
}
