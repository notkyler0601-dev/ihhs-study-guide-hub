import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { useEffect, useState } from 'react';

interface Props {
  data: Record<string, any>[];
  xKey: string;
  // `key` is accepted as an alias for `dataKey` (some guides pass it).
  bars: { dataKey?: string; key?: string; name?: string; color?: string }[];
  height?: number;
  showValues?: boolean;
  stacked?: boolean;
  valueSuffix?: string;
}

// Relative luminance of a #rgb / #rrggbb fill, used to pick label ink that
// stays readable on top of (stacked) or inside a bar.
function isLightFill(hex: string): boolean {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
}

export default function RechartsBar({ data, xKey, bars, height = 320, showValues = false, stacked = false, valueSuffix = '' }: Props) {
  // Mounted guard: SSR-safe placeholder for client:visible. See RechartsLine.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: '100%', height }} />;

  const palette = ['#b91c1c', '#7f1d1d', '#dc2626', '#fca5a5', '#450a0a'];
  // Zero-height segments (common when stacking to color bars by category)
  // get no label, so only the visible bar is tagged.
  const fmt = (v: any) => (v === 0 || v == null || v === '' ? '' : `${v}${valueSuffix}`);
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: showValues ? 22 : 10, right: 16, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey={xKey} stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, color: '#18181b' }} />
          <Legend />
          {bars.map((b, i) => {
            const dataKey = b.dataKey ?? b.key ?? '';
            const fill = b.color ?? palette[i % palette.length];
            return (
              <Bar
                key={dataKey}
                dataKey={dataKey}
                name={b.name ?? dataKey}
                fill={fill}
                stackId={stacked ? 'stack' : undefined}
                radius={stacked ? [0, 0, 0, 0] : [6, 6, 0, 0]}
              >
                {showValues && (
                  <LabelList
                    dataKey={dataKey}
                    position={stacked ? 'inside' : 'top'}
                    formatter={fmt}
                    fill={stacked ? (isLightFill(fill) ? '#18181b' : '#ffffff') : 'currentColor'}
                    fontSize={11}
                    fontWeight={600}
                  />
                )}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
