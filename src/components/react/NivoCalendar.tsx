import { ResponsiveCalendar } from '@nivo/calendar';

interface Props {
  data: { day: string; value: number }[];
  from: string;
  to: string;
  height?: number;
}

export default function NivoCalendar({ data, from, to, height = 220 }: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveCalendar
        data={data}
        from={from}
        to={to}
        emptyColor="#f4f4f5"
        colors={['#fecaca', '#fca5a5', '#f87171', '#dc2626', '#7f1d1d']}
        margin={{ top: 20, right: 20, bottom: 20, left: 30 }}
        yearSpacing={40}
        monthBorderColor="#fff"
        dayBorderWidth={2}
        dayBorderColor="#fff"
      />
    </div>
  );
}
