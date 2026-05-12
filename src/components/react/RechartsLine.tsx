import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

interface Props {
  data: Record<string, any>[];
  xKey: string;
  lines: { dataKey: string; name?: string; color?: string }[];
  height?: number;
}

export default function RechartsLine({ data, xKey, lines, height = 320 }: Props) {
  // Mounted guard: SSR + first client render returns a sized placeholder so
  // this component is safe under client:visible. Real chart mounts on the
  // second render after useEffect fires (which only runs once the island is
  // hydrated, which client:visible defers until in viewport).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: '100%', height }} />;

  const palette = ['#b91c1c', '#7f1d1d', '#dc2626', '#fca5a5', '#450a0a'];
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey={xKey} stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8 }} />
          <Legend />
          {lines.map((l, i) => (
            <Line key={l.dataKey} type="monotone" dataKey={l.dataKey} name={l.name ?? l.dataKey} stroke={l.color ?? palette[i % palette.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
