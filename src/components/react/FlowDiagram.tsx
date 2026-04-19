import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface Props {
  nodes: any[];
  edges: any[];
}

export default function FlowDiagram({ nodes, edges }: Props) {
  return (
    <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
      <Background gap={16} color="#e4e4e7" />
      <MiniMap pannable zoomable style={{ background: '#fff' }} />
      <Controls position="bottom-right" />
    </ReactFlow>
  );
}
