import { Chrono } from 'react-chrono';

interface Item {
  title: string;
  cardTitle?: string;
  cardSubtitle?: string;
  cardDetailedText?: string;
  url?: string;
}
interface Props {
  items: Item[];
  mode?: 'VERTICAL' | 'HORIZONTAL' | 'VERTICAL_ALTERNATING';
  height?: string;
}

export default function ChronoTimeline({ items, mode = 'VERTICAL_ALTERNATING', height = '600px' }: Props) {
  return (
    <div style={{ height, width: '100%' }}>
      <Chrono
        items={items}
        mode={mode}
        disableToolbar
        theme={{
          primary: '#b91c1c',
          secondary: '#fee2e2',
          cardBgColor: '#ffffff',
          titleColor: '#7f1d1d',
          titleColorActive: '#b91c1c',
          cardTitleColor: '#18181b',
          cardSubtitleColor: '#52525b',
          cardDetailsColor: '#3f3f46',
        }}
        cardHeight={140}
        scrollable={{ scrollbar: false }}
        enableOutline
        useReadMore
        fontSizes={{ title: '1rem', cardTitle: '1.05rem', cardSubtitle: '0.85rem', cardText: '0.9rem' }}
      />
    </div>
  );
}
