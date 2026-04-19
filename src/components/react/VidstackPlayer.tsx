import { MediaPlayer, MediaProvider } from '@vidstack/react';

interface Chapter { time: number; title: string; }
interface Props {
  src: string;
  poster?: string;
  title?: string;
  chapters?: Chapter[];
  height?: string;
}

export default function VidstackPlayer({ src, poster, title, height = '420px' }: Props) {
  return (
    <div style={{ width: '100%', height }}>
      <MediaPlayer src={src} poster={poster} title={title} aspectRatio="16/9" style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
        <MediaProvider />
      </MediaPlayer>
    </div>
  );
}
