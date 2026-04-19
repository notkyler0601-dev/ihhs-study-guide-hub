import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: Record<string, any>[];
  xKey: string;
  bars: { dataKey: string; name?: string; color?: string }[];
  height?: number;
}

export default function RechartsBar({ data, xKey, bars, height = 320 }: Props) {
  const palette = ['#b91c1c', '#7f1d1d', '#dc2626', '#fca5a5', '#450a0a'];
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey={xKey} stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8 }} />
          <Legend />
          {bars.map((b, i) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name ?? b.dataKey} fill={b.color ?? palette[i % palette.length]} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
