import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, X, ListCollapse } from 'lucide-react';

/**
 * SidebarOutliner
 * Displays hierarchical code symbols and navigates editor on click.
 */
export default function SidebarOutliner({ outline, onSelectLine, activeLine }) {
  const [search, setSearch] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState({});

  const toggleCollapse = (nodeId) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const collapseAll = () => {
    const newCollapsed = {};
    const traverse = (nodes) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          newCollapsed[node.id] = true;
          traverse(node.children);
        }
      }
    };
    traverse(outline);
    setCollapsedNodes(newCollapsed);
  };

  // Filter items recursively
  const filteredOutline = useMemo(() => {
    if (!search.trim()) return outline;

    const query = search.toLowerCase();

    const filterNode = (node) => {
      const matchName = node.name.toLowerCase().includes(query);
      const filteredChildren = node.children
        ? node.children.map(filterNode).filter(Boolean)
        : [];

      if (matchName || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      return null;
    };

    return outline.map(filterNode).filter(Boolean);
  }, [outline, search]);

  // Recursively render nodes
  const renderTree = (nodes, depth = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isCollapsed = search.trim() ? false : !!collapsedNodes[node.id];
      const isActive = activeLine === node.line;

      return (
        <div key={node.id} className="outliner-node-wrapper">
          <div
            className={`outliner-node depth-${depth} ${isActive ? 'active' : ''}`}
            onClick={() => onSelectLine(node.line)}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                className="outliner-toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.id);
                }}
                aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            ) : (
              <span className="outliner-toggle-spacer" />
            )}

            <span className={`outliner-type-icon icon-${node.type}`}>
              {node.type === 'class' && 'C'}
              {node.type === 'method' && 'M'}
              {node.type === 'function' && 'F'}
              {node.type === 'interface' && 'I'}
              {node.type === 'type' && 'T'}
            </span>

            <span className="outliner-node-name" title={node.name}>
              {node.name}
            </span>

            <span className="outliner-node-line">L{node.line}</span>
          </div>

          {hasChildren && !isCollapsed && (
            <div className="outliner-children-group">
              {renderTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="outliner-sidebar-content">
      <div className="outliner-header">
        <span className="outliner-title">Outline</span>
        <div className="outliner-actions">
          <button
            type="button"
            className="outliner-action-btn"
            onClick={collapseAll}
            title="Collapse All"
          >
            <ListCollapse size={14} />
          </button>
        </div>
      </div>

      <div className="outliner-search-wrap">
        <Search size={14} className="outliner-search-icon" />
        <input
          type="text"
          className="outliner-search-input"
          placeholder="Filter outline..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="outliner-search-clear"
            onClick={() => setSearch('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="outliner-tree-container">
        {filteredOutline.length > 0 ? (
          renderTree(filteredOutline)
        ) : (
          <div className="outliner-empty">
            {search ? 'No matching symbols' : 'No symbols found in this file'}
          </div>
        )}
      </div>
    </div>
  );
}
