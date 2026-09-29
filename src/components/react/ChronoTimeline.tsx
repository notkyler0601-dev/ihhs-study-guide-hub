import { Chrono } from 'react-chrono';
// react-chrono 3 ships its styles separately; without this the cards,
// spine, and layout render as unstyled stacked text.
import 'react-chrono/dist/style.css';

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
          // Year badges sit on a primary-red chip, so their text must be white.
          titleColor: '#ffffff',
          titleColorActive: '#b91c1c',
          cardTitleColor: '#18181b',
          cardSubtitleColor: '#52525b',
          cardDetailsColor: '#3f3f46',
          // Any key left unset falls back to react-chrono's default "electric"
          // blue theme (card borders, active glow, icons), so set them all.
          buttonBorderColor: '#e4e4e7',
          buttonHoverBorderColor: '#b91c1c',
          buttonActiveBorderColor: '#b91c1c',
          buttonHoverBgColor: '#fef2f2',
          buttonActiveBgColor: '#b91c1c',
          buttonActiveIconColor: '#ffffff',
          iconColor: '#b91c1c',
          iconBackgroundColor: '#b91c1c',
          shadowColor: 'rgba(185, 28, 28, 0.1)',
          glowColor: 'rgba(185, 28, 28, 0.2)',
          searchHighlightColor: 'rgba(185, 28, 28, 0.25)',
          toolbarBgColor: '#f4f4f5',
          toolbarBtnBgColor: '#ffffff',
          toolbarTextColor: '#18181b',
          timelineBgColor: '#ffffff',
          nestedCardBgColor: '#fafafa',
          nestedCardTitleColor: '#18181b',
          nestedCardSubtitleColor: '#52525b',
          nestedCardDetailsColor: '#3f3f46',
        }}
        cardHeight={140}
        scrollable={{ scrollbar: false }}
        useReadMore
        fontSizes={{ title: '1rem', cardTitle: '1.05rem', cardSubtitle: '0.85rem', cardText: '0.9rem' }}
      />
    </div>
  );
}
