import React from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';
import { User, Shield, Eye, Edit2 } from 'lucide-react';

export default function ParticipantsPanel({ room, user, onClose }) {
  const { roomId, roomData, activeUsers } = room;
  const roles = roomData?.roles || {};
  const myRole = roles[user?.uid] || 'viewer';
  const isHost = myRole === 'host';

  const handleRoleChange = async (targetUid, newRole) => {
    if (!isHost) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        [`roles.${targetUid}`]: newRole,
      });
      toast.success(`Role updated to ${newRole}`);
    } catch (e) {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="participants-panel" style={{
      position: 'absolute',
      right: '16px',
      top: '48px',
      width: '320px',
      background: 'var(--bg-1)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '16px',
      zIndex: 1000,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} /> Participants ({activeUsers.length})
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer' }}>
          ✕
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
        {activeUsers.map(u => {
          const userRole = roles[u.uid] || 'viewer';
          return (
            <div key={u.uid} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px',
              background: 'var(--bg-2)',
              borderRadius: '6px'
            }}>
              <span style={{ color: 'var(--text-1)', fontSize: '0.85rem' }}>
                {u.displayName} {u.uid === user?.uid && '(You)'}
              </span>
              
              {isHost && u.uid !== user?.uid ? (
                <select 
                  value={userRole}
                  onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                  style={{
                    background: 'var(--bg-3)',
                    color: 'var(--text-1)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '2px 4px',
                    fontSize: '0.75rem'
                  }}
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              ) : (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: userRole === 'host' ? 'var(--yellow)' : (userRole === 'editor' ? 'var(--green)' : 'var(--text-2)'),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {userRole === 'host' && <Shield size={12} />}
                  {userRole === 'editor' && <Edit2 size={12} />}
                  {userRole === 'viewer' && <Eye size={12} />}
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
