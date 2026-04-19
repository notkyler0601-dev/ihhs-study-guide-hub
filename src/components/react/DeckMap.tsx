import { DeckGL } from '@deck.gl/react';
import { ArcLayer, ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map } from 'react-map-gl/maplibre';

interface Arc { from: [number, number]; to: [number, number]; color?: [number, number, number]; width?: number; }
interface Point { lng: number; lat: number; size?: number; color?: [number, number, number]; }
interface Props {
  arcs?: Arc[];
  points?: Point[];
  initialView?: { longitude: number; latitude: number; zoom: number };
  height?: number;
}

export default function DeckMap({ arcs = [], points = [], initialView, height = 480 }: Props) {
  const view = initialView ?? { longitude: 0, latitude: 30, zoom: 1.6 };
  const layers: any[] = [];
  if (arcs.length) {
    layers.push(new ArcLayer({
      id: 'arcs',
      data: arcs,
      getSourcePosition: (d: Arc) => d.from,
      getTargetPosition: (d: Arc) => d.to,
      getSourceColor: (d: Arc) => d.color ?? [185, 28, 28],
      getTargetColor: (d: Arc) => d.color ?? [127, 29, 29],
      getWidth: (d: Arc) => d.width ?? 2,
    }));
  }
  if (points.length) {
    layers.push(new ScatterplotLayer({
      id: 'points',
      data: points,
      getPosition: (d: Point) => [d.lng, d.lat],
      getRadius: (d: Point) => (d.size ?? 5) * 50000,
      getFillColor: (d: Point) => d.color ?? [185, 28, 28],
      pickable: true,
      stroked: true,
      lineWidthMinPixels: 1,
    }));
  }
  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <DeckGL initialViewState={{ ...view, pitch: 35, bearing: 0 }} controller={true} layers={layers}>
        <Map mapStyle="https://demotiles.maplibre.org/style.json" />
      </DeckGL>
    </div>
  );
}
