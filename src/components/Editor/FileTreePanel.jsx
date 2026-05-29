import React, { useState } from 'react';
import { Folder, FolderOpen, FileText, Plus, File, Edit2, Trash2, Check, X, FileCode2 } from 'lucide-react';
import FileIcon from '../Icons/FileIcon';
import './FileTreePanel.css';
import toast from 'react-hot-toast';

function FileTreeNode({ item, files, activeFileId, onSelect, onRename, onDelete, onCreate, isReadOnly, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);

  const isFolder = item.isFolder;
  const children = files.filter(f => f.parentId === item.id);

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (renameValue.trim() && renameValue !== item.name) {
      onRename(item.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setIsRenaming(false);
  };

  return (
    <div className="file-tree-node-wrapper">
      <div 
        className={`file-tree-node ${activeFileId === item.id ? 'active' : ''}`}
        style={{ paddingLeft: `${level * 14 + 10}px` }}
        onClick={(e) => {
          if (isRenaming) return;
          if (isFolder) setExpanded(!expanded);
          else onSelect(item.id);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span className="file-tree-icon">
          {isFolder ? (
            expanded ? <FolderOpen size={14} color="#90caf9" /> : <Folder size={14} fill="#90caf9" color="#90caf9" />
          ) : (
            <FileIcon filename={item.name} size={14} />
          )}
        </span>
        
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="file-tree-rename-form">
            <input 
              type="text" 
              value={renameValue} 
              onChange={(e) => setRenameValue(e.target.value)} 
              onBlur={() => setIsRenaming(false)}
              onKeyDown={handleKeyDown}
              autoFocus 
              className="file-tree-rename-input"
            />
          </form>
        ) : (
          <span className="file-tree-name">{item.name}</span>
        )}
        
        {!isReadOnly && isHovered && !isRenaming && (
          <div className="file-tree-actions" onClick={e => e.stopPropagation()}>
            {isFolder && (
              <button onClick={() => onCreate(item.id, false)} title="New File">
                <FileCode2 size={12} />
              </button>
            )}
            {isFolder && (
              <button onClick={() => onCreate(item.id, true)} title="New Folder">
                <Folder size={12} />
              </button>
            )}
            <button onClick={() => { setIsRenaming(true); setRenameValue(item.name); }} title="Rename">
              <Edit2 size={12} />
            </button>
            <button onClick={() => { if(confirm(`Delete ${item.name}?`)) onDelete(item.id); }} title="Delete" className="delete-btn">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
      
      {isFolder && expanded && (
        <div className="file-tree-children">
          {children.map(child => (
            <FileTreeNode 
              key={child.id} 
              item={child} 
              files={files}
              activeFileId={activeFileId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCreate={onCreate}
              isReadOnly={isReadOnly}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTreePanel({ room, activeFileId, onSelectFile, isReadOnly }) {
  const files = room.roomData?.files || [];
  const rootFiles = files.filter(f => !f.parentId);

  const getLanguageFromExt = (name) => {
    if (name.endsWith('.js')) return 'javascript';
    if (name.endsWith('.py')) return 'python';
    if (name.endsWith('.cpp')) return 'cpp';
    if (name.endsWith('.html')) return 'html';
    if (name.endsWith('.css')) return 'css';
    if (name.endsWith('.json')) return 'json';
    return 'plaintext';
  };

  const handleCreateFile = (parentId = null, isFolder = false) => {
    let newName = isFolder ? prompt('Enter folder name:') : prompt('Enter file name:');
    if (!newName) return;
    
    room.createFile({
      name: newName,
      content: isFolder ? '' : '// new file\n',
      language: isFolder ? '' : getLanguageFromExt(newName),
      isFolder: isFolder,
      parentId: parentId
    });
  };

  return (
    <div className="file-tree-panel">
      <div className="file-tree-header">
        <span className="file-tree-title">EXPLORER</span>
        {!isReadOnly && (
          <div className="file-tree-header-actions">
            <button onClick={() => handleCreateFile(null, false)} title="New File">
              <FileCode2 size={14} />
            </button>
            <button onClick={() => handleCreateFile(null, true)} title="New Folder">
              <Folder size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="file-tree-content">
        {rootFiles.length === 0 ? (
          <div className="file-tree-empty">No files</div>
        ) : (
          rootFiles.map(file => (
            <FileTreeNode 
              key={file.id} 
              item={file} 
              files={files} 
              activeFileId={activeFileId}
              onSelect={onSelectFile}
              onRename={room.renameFile}
              onDelete={room.deleteFile}
              onCreate={handleCreateFile}
              isReadOnly={isReadOnly}
            />
          ))
        )}
      </div>
    </div>
  );
}
