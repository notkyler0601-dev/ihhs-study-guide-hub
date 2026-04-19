import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

interface Item {
  date: string;
  title: string;
  subtitle?: string;
  body?: string;
  icon?: string;
}
interface Props { items: Item[]; }

export default function VerticalTimelineWrapper({ items }: Props) {
  return (
    <VerticalTimeline lineColor="#b91c1c">
      {items.map((it, i) => (
        <VerticalTimelineElement
          key={i}
          date={it.date}
          contentStyle={{ background: '#fff', color: '#18181b', boxShadow: '0 4px 24px -8px rgba(0,0,0,0.12)', border: '1px solid #e4e4e7', borderRadius: 12 }}
          contentArrowStyle={{ borderRight: '7px solid #e4e4e7' }}
          iconStyle={{ background: '#b91c1c', color: '#fff' }}
          icon={<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontWeight: 700 }}>{it.icon ?? '●'}</span>}
        >
          <h3 style={{ margin: 0, fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.15rem', fontWeight: 600 }}>{it.title}</h3>
          {it.subtitle && <h4 style={{ margin: '4px 0 0', color: '#52525b', fontSize: '0.85rem', fontWeight: 500 }}>{it.subtitle}</h4>}
          {it.body && <p style={{ margin: '8px 0 0', color: '#3f3f46', fontSize: '0.9rem', lineHeight: 1.6 }}>{it.body}</p>}
        </VerticalTimelineElement>
      ))}
    </VerticalTimeline>
  );
}
