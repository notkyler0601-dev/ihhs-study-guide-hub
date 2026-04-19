import ReactPlayer from 'react-player';

interface Props {
  url: string;
  width?: string;
  height?: string;
  controls?: boolean;
}

export default function VideoPlayer({ url, width = '100%', height = '420px', controls = true }: Props) {
  return (
    <div style={{ position: 'relative', width, height, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
      <ReactPlayer src={url} width="100%" height="100%" controls={controls} />
    </div>
  );
}
