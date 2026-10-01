import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 50 }, data: { label: 'Client (Browser)' }, className: 'bg-dark-800 text-[#000000] border-primary-500 rounded-lg p-3 w-40 text-center shadow-lg' },
  { id: '2', position: { x: 250, y: 150 }, data: { label: 'API Gateway (Routes)' }, className: 'bg-dark-800 text-[#000000] border-blue-500 rounded-lg p-3 w-40 text-center shadow-lg' },
  { id: '3', position: { x: 100, y: 250 }, data: { label: 'Auth Service' }, className: 'bg-dark-800 text-[#000000] border-purple-500 rounded-lg p-3 w-40 text-center shadow-lg' },
  { id: '4', position: { x: 400, y: 250 }, data: { label: 'User Service' }, className: 'bg-dark-800 text-[#000000] border-purple-500 rounded-lg p-3 w-40 text-center shadow-lg' },
  { id: '5', position: { x: 250, y: 350 }, data: { label: 'Database (MongoDB)' }, className: 'bg-dark-800 text-[#000000] border-green-500 rounded-lg p-3 w-40 text-center shadow-lg' },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#FBE16B' } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#E8BE28' } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: '#E8BE28' } },
  { id: 'e3-5', source: '3', target: '5', animated: true, style: { stroke: '#E8BE28' } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#E8BE28' } },
];

export default function ArchitecturePage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-full w-full glass-panel flex flex-col relative overflow-hidden">
       <div className="absolute top-4 left-4 z-10 glass-panel px-4 py-2 text-sm font-semibold pointer-events-auto">
          System Architecture
       </div>
       <div className="flex-1 w-full h-full">
         <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-dark-900/50"
          >
            <Controls className="bg-dark-800 fill-white text-black border-none shadow-xl" />
            <MiniMap 
               nodeStrokeColor={(n) => {
                  if (n.className?.includes('primary')) return '#FBE16B';
                  return '#FDEFA8';
               }}
               nodeColor="#FFFBE0"
               maskColor="rgba(11, 13, 23, 0.7)"
               className="bg-dark-800 rounded-lg border border-black"
            />
            <Background color="#FDEFA8" gap={16} size={1} />
          </ReactFlow>
       </div>
    </div>
  );
}
