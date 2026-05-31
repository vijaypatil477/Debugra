import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useMindMap } from '../../hooks/useMindMap';
import toast from 'react-hot-toast';

const NODE_W = 140;
const NODE_H = 48;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;

// ── Helpers ──────────────────────────────────────────────────────────────────
function getNodeCenter(node) {
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 };
}

function EdgeLine({ edge, nodes, selected, onClick }) {
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);
  if (!from || !to) return null;
  const f = getNodeCenter(from);
  const t = getNodeCenter(to);
  const mx = (f.x + t.x) / 2;
  const my = (f.y + t.y) / 2;
  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(edge.id); }} style={{ cursor: 'pointer' }}>
      {/* Invisible thick hit area */}
      <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth={12} />
      <line
        x1={f.x} y1={f.y} x2={t.x} y2={t.y}
        stroke={selected ? '#fff' : 'rgba(255,255,255,0.25)'}
        strokeWidth={selected ? 2 : 1.5}
        strokeDasharray={selected ? '6 3' : 'none'}
        style={{ transition: 'stroke 0.15s' }}
      />
      {/* Delete badge on selected */}
      {selected && (
        <g transform={`translate(${mx},${my})`}>
          <circle r={9} fill="#f44747" />
          <text textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={12} fontWeight={700}>×</text>
        </g>
      )}
    </g>
  );
}

function ConnectingLine({ from, nodes, mousePos }) {
  const node = nodes.find((n) => n.id === from);
  if (!node || !mousePos) return null;
  const f = getNodeCenter(node);
  return (
    <line
      x1={f.x} y1={f.y} x2={mousePos.x} y2={mousePos.y}
      stroke="rgba(78,201,176,0.7)" strokeWidth={1.5} strokeDasharray="6 3"
      style={{ pointerEvents: 'none' }}
    />
  );
}

export default function MindMapCanvas({ roomId, user, onClose }) {
  const { nodes, edges, isLoading, error, addNode, updateNode, deleteNode, moveNode, commitMove, addEdge, deleteEdge, clearAll } = useMindMap({ roomId, user });

  // ── View state ────────────────────────────────────────────────────────────
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);

  // ── Interaction state ─────────────────────────────────────────────────────
  const [dragging, setDragging] = useState(null);
  const [panning, setPanning] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const inputRef = useRef(null);
  const [showHelp, setShowHelp] = useState(false);

  // ── SVG coordinate helpers ────────────────────────────────────────────────
  const toSVG = useCallback((clientX, clientY) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // ── Double-click canvas → add node ───────────────────────────────────────
  const handleCanvasDblClick = useCallback((e) => {
    if (e.target !== svgRef.current && e.target.tagName !== 'rect') return;
    const { x, y } = toSVG(e.clientX, e.clientY);
    addNode(x - NODE_W / 2, y - NODE_H / 2);
  }, [toSVG, addNode]);

  // ── Mouse move ────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const { x, y } = toSVG(e.clientX, e.clientY);
    if (connecting) setMousePos({ x, y });

    if (dragging) {
      moveNode(dragging.nodeId, x - dragging.ox, y - dragging.oy);
    }

    if (panning) {
      setPan({
        x: panning.panX + (e.clientX - panning.startX),
        y: panning.panY + (e.clientY - panning.startY),
      });
    }
  }, [connecting, dragging, panning, toSVG, moveNode]);

  // ── Mouse up ──────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e) => {
    if (dragging) {
      const { x, y } = toSVG(e.clientX, e.clientY);
      commitMove(dragging.nodeId, x - dragging.ox, y - dragging.oy);
      setDragging(null);
    }
    if (panning) setPanning(null);
  }, [dragging, panning, toSVG, commitMove]);

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta)));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Node mouse down ───────────────────────────────────────────────────────
  const handleNodeMouseDown = useCallback((e, node) => {
    e.stopPropagation();
    if (connecting) return;
    const { x, y } = toSVG(e.clientX, e.clientY);
    setDragging({ nodeId: node.id, ox: x - node.x, oy: y - node.y });
    setSelectedEdge(null);
  }, [connecting, toSVG]);

  // ── Canvas mouse down → start pan ────────────────────────────────────────
  const handleCanvasMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (connecting) { setConnecting(null); setMousePos(null); return; }
    setSelectedEdge(null);
    setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
  }, [connecting, pan]);

  // ── Node click (connect mode) ─────────────────────────────────────────────
  const handleNodeClick = useCallback((e, node) => {
    e.stopPropagation();
    if (connecting) {
      addEdge(connecting, node.id);
      setConnecting(null);
      setMousePos(null);
    }
  }, [connecting, addEdge]);

  // ── Node double-click → edit label ───────────────────────────────────────
  const handleNodeDblClick = useCallback((e, node) => {
    e.stopPropagation();
    setEditingNode(node.id);
    setEditLabel(node.label);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  const commitEdit = useCallback(() => {
    if (editingNode && editLabel.trim()) {
      updateNode(editingNode, { label: editLabel.trim() });
    }
    setEditingNode(null);
  }, [editingNode, editLabel, updateNode]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (editingNode) return;
      if (e.key === 'Escape') { setConnecting(null); setMousePos(null); setSelectedEdge(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge) {
        deleteEdge(selectedEdge);
        setSelectedEdge(null);
      }
      if (e.key === '?') setShowHelp(!showHelp);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingNode, selectedEdge, deleteEdge, showHelp]);

  const transform = `translate(${pan.x},${pan.y}) scale(${zoom})`;

  // Memoize stats to prevent unnecessary recalculations
  const stats = useMemo(() => ({
    nodeCount: nodes.length,
    edgeCount: edges.length,
  }), [nodes.length, edges.length]);

  return (
    <div style={styles.root} role="dialog" aria-label="Mind Map Canvas">
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>✦ Mind Map</span>
          {roomId && (
            <span style={styles.syncBadge} title={isLoading ? 'Syncing changes...' : 'All changes synced'}>
              <span style={{ ...styles.syncDot, background: isLoading ? '#dcdcaa' : '#4ec9b0' }} />
              {isLoading ? 'Syncing…' : 'Live'}
            </span>
          )}
          {!roomId && (
            <span style={styles.localBadge}>Local — join a room to sync</span>
          )}
          {error && (
            <span style={{ ...styles.localBadge, color: '#f44747', borderColor: 'rgba(244,71,71,0.2)' }}>
              ⚠ Sync error
            </span>
          )}
        </div>
        <div style={styles.headerRight}>
          <span style={styles.hint}>Dbl-click to add · Drag to move · Connect to link · Scroll to zoom</span>
          <button
            style={styles.helpBtn}
            onClick={() => setShowHelp(!showHelp)}
            title="Keyboard shortcuts"
            aria-label="Show help"
          >
            ?
          </button>
          <button style={styles.clearBtn} onClick={clearAll} title="Clear canvas">Clear</button>
          <button style={styles.closeBtn} onClick={onClose} title="Close mind map" aria-label="Close">✕</button>
        </div>
      </div>

      {/* ── Help Panel ── */}
      {showHelp && (
        <div style={styles.helpPanel}>
          <div style={styles.helpContent}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#d4d4d4' }}>Keyboard Shortcuts</h3>
            <div style={{ fontSize: '0.65rem', color: '#9d9d9d', lineHeight: '1.6' }}>
              <div><strong>Double-click</strong> canvas to add node</div>
              <div><strong>Drag</strong> node to move</div>
              <div><strong>Click</strong> connect icon to link nodes</div>
              <div><strong>Scroll</strong> to zoom in/out</div>
              <div><strong>Delete/Backspace</strong> to remove selected edge</div>
              <div><strong>Esc</strong> to cancel connection mode</div>
              <div><strong>?</strong> to toggle this help</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={styles.toolbar}>
        <button
          style={{ ...styles.toolBtn, ...(connecting ? styles.toolBtnActive : {}) }}
          onClick={() => { setConnecting(null); setMousePos(null); }}
          title="Select / Pan (Esc)"
          aria-label="Select mode"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3l14 9-7 1-4 7z" />
          </svg>
          Select
        </button>
        <button
          style={{ ...styles.toolBtn, ...(connecting ? styles.toolBtnActive : {}) }}
          onClick={() => connecting ? (setConnecting(null), setMousePos(null)) : null}
          title="Connect mode — click a node to start"
          aria-label="Connect mode"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
          {connecting ? 'Connecting…' : 'Connect'}
        </button>
        <div style={styles.toolSep} />
        <span style={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <button style={styles.toolBtn} onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))} title="Zoom in" aria-label="Zoom in">+</button>
        <button style={styles.toolBtn} onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))} title="Zoom out" aria-label="Zoom out">−</button>
        <button style={styles.toolBtn} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset view" aria-label="Reset view">Reset</button>
        <div style={styles.toolSep} />
        <span style={styles.nodeCount}>{stats.nodeCount} nodes · {stats.edgeCount} edges</span>
      </div>

      {/* ── Canvas ── */}
      <svg
        ref={svgRef}
        style={styles.svg}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleCanvasMouseDown}
        onDoubleClick={handleCanvasDblClick}
        role="img"
        aria-label="Mind map canvas"
      >
        {/* Background grid */}
        <defs>
          <pattern id="mm-grid" width={40 * zoom} height={40 * zoom} patternUnits="userSpaceOnUse"
            x={pan.x % (40 * zoom)} y={pan.y % (40 * zoom)}>
            <path d={`M ${40 * zoom} 0 L 0 0 0 ${40 * zoom}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mm-grid)" />

        <g transform={transform}>
          {/* Edges */}
          {edges.map((edge) => (
            <EdgeLine
              key={edge.id}
              edge={edge}
              nodes={nodes}
              selected={selectedEdge === edge.id}
              onClick={(id) => setSelectedEdge(selectedEdge === id ? null : id)}
            />
          ))}

          {/* Live connecting line */}
          {connecting && <ConnectingLine from={connecting} nodes={nodes} mousePos={mousePos} />}

          {/* Nodes */}
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              isEditing={editingNode === node.id}
              editLabel={editLabel}
              setEditLabel={setEditLabel}
              inputRef={inputRef}
              connecting={connecting}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onClick={(e) => handleNodeClick(e, node)}
              onDblClick={(e) => handleNodeDblClick(e, node)}
              onCommitEdit={commitEdit}
              onStartConnect={(e) => { e.stopPropagation(); setConnecting(node.id); setMousePos(getNodeCenter(node)); }}
              onDelete={(e) => { e.stopPropagation(); deleteNode(node.id); }}
            />
          ))}
        </g>

        {/* Empty state */}
        {nodes.length === 0 && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
            fill="rgba(255,255,255,0.15)" fontSize={14} fontFamily="Inter, sans-serif"
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            Double-click anywhere to add your first node
          </text>
        )}
      </svg>
    </div>
  );
}

// ── NodeCard ─────────────────────────────────────────────────────────────────
function NodeCard({ node, isEditing, editLabel, setEditLabel, inputRef, connecting,
  onMouseDown, onClick, onDblClick, onCommitEdit, onStartConnect, onDelete }) {

  const isTarget = connecting && connecting !== node.id;

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDoubleClick={onDblClick}
      style={{ cursor: connecting ? (isTarget ? 'crosshair' : 'default') : 'grab' }}
      role="button"
      tabIndex={0}
      aria-label={`Node: ${node.label}`}
    >
      {/* Glow on hover */}
      <rect
        width={NODE_W} height={NODE_H} rx={10}
        fill="transparent"
        stroke={isTarget ? node.color : 'transparent'}
        strokeWidth={isTarget ? 2 : 0}
        style={{ filter: isTarget ? `drop-shadow(0 0 8px ${node.color})` : 'none', transition: 'all 0.15s' }}
      />
      {/* Card body */}
      <rect
        width={NODE_W} height={NODE_H} rx={10}
        fill="rgba(30,30,46,0.92)"
        stroke={node.color}
        strokeWidth={1.5}
        style={{ filter: `drop-shadow(0 2px 8px rgba(0,0,0,0.5))` }}
      />
      {/* Color accent bar */}
      <rect x={0} y={0} width={4} height={NODE_H} rx={2} fill={node.color} />

      {/* Label or input */}
      {isEditing ? (
        <foreignObject x={10} y={10} width={NODE_W - 20} height={NODE_H - 20}>
          <input
            ref={inputRef}
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={onCommitEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') onCommitEdit(); if (e.key === 'Escape') onCommitEdit(); }}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: '#d4d4d4', fontSize: '0.72rem', fontFamily: 'Inter, sans-serif', fontWeight: 600,
            }}
            aria-label="Edit node label"
          />
        </foreignObject>
      ) : (
        <text
          x={NODE_W / 2 + 2} y={NODE_H / 2}
          textAnchor="middle" dominantBaseline="central"
          fill="#d4d4d4" fontSize={11} fontFamily="Inter, sans-serif" fontWeight={600}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.label.length > 18 ? node.label.slice(0, 17) + '…' : node.label}
        </text>
      )}

      {/* Action buttons */}
      {!connecting && !isEditing && (
        <>
          {/* Connect button */}
          <g transform={`translate(${NODE_W - 18}, -10)`} onClick={onStartConnect} style={{ cursor: 'crosshair' }} role="button" aria-label="Connect node">
            <circle r={9} fill="rgba(30,30,46,0.95)" stroke="rgba(78,201,176,0.6)" strokeWidth={1} />
            <line x1={-4} y1={0} x2={4} y2={0} stroke="#4ec9b0" strokeWidth={1.5} />
            <line x1={0} y1={-4} x2={0} y2={4} stroke="#4ec9b0" strokeWidth={1.5} />
          </g>
          {/* Delete button */}
          <g transform={`translate(${NODE_W + 2}, -10)`} onClick={onDelete} style={{ cursor: 'pointer' }} role="button" aria-label="Delete node">
            <circle r={9} fill="rgba(30,30,46,0.95)" stroke="rgba(244,71,71,0.6)" strokeWidth={1} />
            <line x1={-4} y1={-4} x2={4} y2={4} stroke="#f44747" strokeWidth={1.5} />
            <line x1={4} y1={-4} x2={-4} y2={4} stroke="#f44747" strokeWidth={1.5} />
          </g>
        </>
      )}
    </g>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    position: 'fixed', inset: 0, zIndex: 150,
    display: 'flex', flexDirection: 'column',
    background: '#0f0f1a',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', height: 44, flexShrink: 0,
    background: 'rgba(30,30,46,0.98)', borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: '0.85rem', fontWeight: 700, color: '#d4d4d4', fontFamily: 'Inter, sans-serif' },
  syncBadge: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: '0.65rem', color: '#9d9d9d', fontFamily: 'Inter, sans-serif',
    background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 99,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  syncDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  localBadge: {
    fontSize: '0.62rem', color: '#6a6a6a', fontFamily: 'Inter, sans-serif',
    background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: 99,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  hint: { fontSize: '0.6rem', color: '#4a4a5a', fontFamily: 'Inter, sans-serif' },
  helpBtn: {
    width: 28, height: 28, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent', color: '#9d9d9d', fontSize: '0.85rem',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtn: {
    padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(244,71,71,0.3)',
    background: 'transparent', color: '#f44747', fontSize: '0.68rem',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  },
  closeBtn: {
    width: 28, height: 28, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent', color: '#9d9d9d', fontSize: '0.85rem',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  helpPanel: {
    padding: '12px 16px', background: 'rgba(20,20,36,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  helpContent: {
    maxWidth: '100%',
  },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 38, flexShrink: 0,
    background: 'rgba(20,20,36,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)',
    overflowX: 'auto',
  },
  toolBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent', color: '#9d9d9d', fontSize: '0.68rem',
    fontFamily: 'Inter, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  toolBtnActive: {
    background: 'rgba(78,201,176,0.12)', borderColor: 'rgba(78,201,176,0.4)', color: '#4ec9b0',
  },
  toolSep: { width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 4px', flexShrink: 0 },
  zoomLabel: { fontSize: '0.65rem', color: '#6a6a6a', fontFamily: 'JetBrains Mono, monospace', minWidth: 36 },
  nodeCount: { fontSize: '0.62rem', color: '#4a4a5a', fontFamily: 'Inter, sans-serif', marginLeft: 4, whiteSpace: 'nowrap' },
  svg: { flex: 1, display: 'block', cursor: 'default', userSelect: 'none' },
};
