import { motion, type PanInfo } from 'motion/react';
import type React from 'react';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  FiArrowRight,
  FiDatabase,
  FiLink,
  FiMail,
  FiPlus,
  FiSettings,
  FiZap,
} from 'react-icons/fi';

// Interactive workflow builder — a taste of how HIBEEX automations think.
// Adapted from an n8n-style shadcn/Tailwind block to this project's SCSS stack.

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  from: string;
  to: string;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

const nodeTemplates: Omit<WorkflowNode, 'id' | 'position'>[] = [
  {
    type: 'trigger',
    title: 'Bank Feed',
    description: 'New transactions arrive from the bank',
    icon: FiLink,
    color: 'emerald',
  },
  {
    type: 'action',
    title: 'AI Categorizer',
    description: 'Classify every transaction automatically',
    icon: FiZap,
    color: 'blue',
  },
  {
    type: 'condition',
    title: 'Anomaly Check',
    description: 'Spot unusual spending patterns',
    icon: FiSettings,
    color: 'amber',
  },
  {
    type: 'action',
    title: 'Owner Alert',
    description: 'Send an insight the owner can act on',
    icon: FiMail,
    color: 'purple',
  },
  {
    type: 'action',
    title: 'Ledger Update',
    description: 'Record everything to the books',
    icon: FiDatabase,
    color: 'indigo',
  },
];

const initialNodes: WorkflowNode[] = [
  { ...nodeTemplates[0], id: 'node-1', position: { x: 50, y: 100 } },
  { ...nodeTemplates[1], id: 'node-2', position: { x: 300, y: 100 } },
  { ...nodeTemplates[2], id: 'node-3', position: { x: 550, y: 100 } },
];

const initialConnections: WorkflowConnection[] = [
  { from: 'node-1', to: 'node-2' },
  { from: 'node-2', to: 'node-3' },
];

function ConnectionLine({
  from,
  to,
  nodes,
}: {
  from: string;
  to: string;
  nodes: WorkflowNode[];
}) {
  const fromNode = nodes.find((n) => n.id === from);
  const toNode = nodes.find((n) => n.id === to);
  if (!fromNode || !toNode) return null;

  const startX = fromNode.position.x + NODE_WIDTH;
  const startY = fromNode.position.y + NODE_HEIGHT / 2;
  const endX = toNode.position.x;
  const endY = toNode.position.y + NODE_HEIGHT / 2;
  const cp1X = startX + (endX - startX) * 0.5;
  const cp2X = endX - (endX - startX) * 0.5;
  const path = `M${startX},${startY} C${cp1X},${startY} ${cp2X},${endY} ${endX},${endY}`;

  return (
    <path
      d={path}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeDasharray="8,6"
      strokeLinecap="round"
      opacity={0.35}
    />
  );
}

function WorkflowPlayground() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [connections, setConnections] =
    useState<WorkflowConnection[]>(initialConnections);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [contentSize, setContentSize] = useState(() => {
    const maxX = Math.max(...initialNodes.map((n) => n.position.x + NODE_WIDTH));
    const maxY = Math.max(...initialNodes.map((n) => n.position.y + NODE_HEIGHT));
    return { width: maxX + 50, height: maxY + 50 };
  });

  const handleDragStart = (nodeId: string) => {
    setDraggingNodeId(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      dragStartPosition.current = { x: node.position.x, y: node.position.y };
    }
  };

  const handleDrag = (nodeId: string, { offset }: PanInfo) => {
    if (draggingNodeId !== nodeId || !dragStartPosition.current) return;
    const constrainedX = Math.max(0, dragStartPosition.current.x + offset.x);
    const constrainedY = Math.max(0, dragStartPosition.current.y + offset.y);
    flushSync(() => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId
            ? { ...node, position: { x: constrainedX, y: constrainedY } }
            : node,
        ),
      );
    });
    setContentSize((prev) => ({
      width: Math.max(prev.width, constrainedX + NODE_WIDTH + 50),
      height: Math.max(prev.height, constrainedY + NODE_HEIGHT + 50),
    }));
  };

  const handleDragEnd = () => {
    setDraggingNodeId(null);
    dragStartPosition.current = null;
  };

  const addNode = () => {
    const template =
      nodeTemplates[Math.floor(Math.random() * nodeTemplates.length)];
    const lastNode = nodes[nodes.length - 1];
    const newPosition = lastNode
      ? { x: lastNode.position.x + 250, y: lastNode.position.y }
      : { x: 50, y: 100 };
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      ...template,
      position: newPosition,
    };
    flushSync(() => {
      setNodes((prev) => [...prev, newNode]);
      if (lastNode) {
        setConnections((prev) => [...prev, { from: lastNode.id, to: newNode.id }]);
      }
    });
    setContentSize((prev) => ({
      width: Math.max(prev.width, newPosition.x + NODE_WIDTH + 50),
      height: Math.max(prev.height, newPosition.y + NODE_HEIGHT + 50),
    }));
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.scrollTo({
        left: newPosition.x + NODE_WIDTH - canvas.clientWidth + 100,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="workflow-section" id="automation">
      <h2 className="heading" data-color-inverted="true">
        Automation, Visualized.
      </h2>
      <p
        className="workflow-sub"
      >
        A taste of how HIBEEX turns raw financial data into decisions — drag the
        blocks around, add your own nodes.
      </p>

      <div className="workflow-block">
        <div className="workflow-header">
          <div className="workflow-header-left">
            <span className="wf-badge">Active</span>
            <span className="wf-label">HIBEEX Workflow Builder</span>
          </div>
          <button className="wf-add" onClick={addNode} aria-label="Add new node">
            <FiPlus /> <span>Add Node</span>
          </button>
        </div>

        <div
          ref={canvasRef}
          className="workflow-canvas"
          role="region"
          aria-label="Workflow canvas"
        >
          <div
            className="wf-content"
            style={{ minWidth: contentSize.width, minHeight: contentSize.height }}
          >
            <svg
              className="wf-lines"
              width={contentSize.width}
              height={contentSize.height}
              aria-hidden="true"
            >
              {connections.map((c) => (
                <ConnectionLine
                  key={`${c.from}-${c.to}`}
                  from={c.from}
                  to={c.to}
                  nodes={nodes}
                />
              ))}
            </svg>

            {nodes.map((node) => {
              const Icon = node.icon;
              const isDragging = draggingNodeId === node.id;
              return (
                <motion.div
                  key={node.id}
                  drag
                  dragMomentum={false}
                  dragConstraints={{ left: 0, top: 0, right: 100000, bottom: 100000 }}
                  onDragStart={() => handleDragStart(node.id)}
                  onDrag={(_, info) => handleDrag(node.id, info)}
                  onDragEnd={handleDragEnd}
                  style={{
                    x: node.position.x,
                    y: node.position.y,
                    width: NODE_WIDTH,
                    transformOrigin: '0 0',
                  }}
                  className="wf-node"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileDrag={{ scale: 1.05, zIndex: 50, cursor: 'grabbing' }}
                >
                  <div
                    className={`wf-card ${node.color} ${isDragging ? 'dragging' : ''}`}
                    role="article"
                    aria-label={`${node.type} node: ${node.title}`}
                  >
                    <div className="wf-node-head">
                      <div className="wf-icon" aria-hidden="true">
                        <Icon />
                      </div>
                      <div className="wf-node-titles">
                        <span className="wf-type">{node.type}</span>
                        <h3>{node.title}</h3>
                      </div>
                    </div>
                    <p className="wf-desc">{node.description}</p>
                    <div className="wf-connected">
                      <FiArrowRight aria-hidden="true" />
                      <span>Connected</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="workflow-footer" role="status" aria-live="polite">
          <div className="wf-stats">
            <span className="wf-stat">
              <i className="dot green" /> {nodes.length}{' '}
              {nodes.length === 1 ? 'Node' : 'Nodes'}
            </span>
            <span className="wf-stat">
              <i className="dot orange" /> {connections.length}{' '}
              {connections.length === 1 ? 'Connection' : 'Connections'}
            </span>
          </div>
          <p className="wf-hint">Drag nodes to reposition</p>
        </div>
      </div>
    </div>
  );
}

export default WorkflowPlayground;
