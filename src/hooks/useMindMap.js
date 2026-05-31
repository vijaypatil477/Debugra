import { useState, useCallback, useRef, useEffect } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

const COLORS = ['#4ec9b0', '#569cd6', '#dcdcaa', '#ce9178', '#c586c0', '#f44747', '#9cdcfe'];
const MAX_NODES = 500;
const DEBOUNCE_MS = 300;

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export function useMindMap({ roomId, user }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const localUpdateRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const unsubRef = useRef(null);

  const docId = roomId ? `mindmap_${roomId}` : null;

  // ── Real-time Firestore sync ──────────────────────────────────────────────
  useEffect(() => {
    if (!docId) return;
    setIsLoading(true);
    setError(null);
    
    try {
      unsubRef.current = onSnapshot(
        doc(db, 'mindmaps', docId),
        (snap) => {
          setIsLoading(false);
          if (!snap.exists()) return;
          if (localUpdateRef.current) {
            localUpdateRef.current = false;
            return;
          }
          const data = snap.data();
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
        },
        (err) => {
          setIsLoading(false);
          setError(err.message);
          console.error('Firestore sync error:', err);
        }
      );
    } catch (err) {
      setIsLoading(false);
      setError(err.message);
    }

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [docId]);

  const persist = useCallback(
    async (newNodes, newEdges) => {
      if (!docId) return;
      
      // Validate data
      if (newNodes.length > MAX_NODES) {
        toast.error(`Max ${MAX_NODES} nodes allowed`);
        return;
      }

      localUpdateRef.current = true;
      try {
        await setDoc(
          doc(db, 'mindmaps', docId),
          {
            nodes: newNodes,
            edges: newEdges,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid || 'anonymous',
          },
          { merge: true }
        );
        setError(null);
      } catch (err) {
        localUpdateRef.current = false;
        setError(err.message);
        console.error('Persist error:', err);
      }
    },
    [docId, user]
  );

  // ── Node operations ───────────────────────────────────────────────────────
  const addNode = useCallback(
    (x, y, label = 'New Node') => {
      setNodes((prev) => {
        if (prev.length >= MAX_NODES) {
          toast.error(`Max ${MAX_NODES} nodes reached`);
          return prev;
        }
        const node = {
          id: makeId(),
          x: Math.round(x),
          y: Math.round(y),
          label: label.trim() || 'New Node',
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          createdBy: user?.displayName || 'Guest',
          createdAt: Date.now(),
        };
        const next = [...prev, node];
        persist(next, edges);
        return next;
      });
    },
    [edges, persist, user]
  );

  const updateNode = useCallback(
    (id, changes) => {
      setNodes((prev) => {
        const next = prev.map((n) =>
          n.id === id ? { ...n, ...changes, label: (changes.label || n.label).trim() } : n
        );
        persist(next, edges);
        return next;
      });
    },
    [edges, persist]
  );

  const deleteNode = useCallback(
    (id) => {
      setNodes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        setEdges((prevEdges) => {
          const nextEdges = prevEdges.filter((e) => e.from !== id && e.to !== id);
          persist(next, nextEdges);
          return nextEdges;
        });
        return next;
      });
    },
    [persist]
  );

  const moveNode = useCallback((id, x, y) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, x: Math.round(x), y: Math.round(y) } : n
      )
    );
  }, []);

  const commitMove = useCallback(
    (id, x, y) => {
      // Debounce persist calls
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        setNodes((prev) => {
          const next = prev.map((n) =>
            n.id === id ? { ...n, x: Math.round(x), y: Math.round(y) } : n
          );
          persist(next, edges);
          return next;
        });
      }, DEBOUNCE_MS);
    },
    [edges, persist]
  );

  // ── Edge operations ───────────────────────────────────────────────────────
  const addEdge = useCallback(
    (from, to) => {
      if (from === to) return;
      setEdges((prev) => {
        // Check for duplicate edges (bidirectional)
        if (
          prev.some(
            (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
          )
        ) {
          return prev;
        }
        const next = [...prev, { id: makeId(), from, to }];
        persist(nodes, next);
        return next;
      });
    },
    [nodes, persist]
  );

  const deleteEdge = useCallback(
    (id) => {
      setEdges((prev) => {
        const next = prev.filter((e) => e.id !== id);
        persist(nodes, next);
        return next;
      });
    },
    [nodes, persist]
  );

  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    persist([], []);
    toast.success('Canvas cleared');
  }, [persist]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return {
    nodes,
    edges,
    isLoading,
    error,
    addNode,
    updateNode,
    deleteNode,
    moveNode,
    commitMove,
    addEdge,
    deleteEdge,
    clearAll,
  };
}
