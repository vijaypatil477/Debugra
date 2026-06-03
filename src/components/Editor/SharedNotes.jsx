import React from 'react';
import './SharedNotes.css';

export default function SharedNotes({ notes, updateNotes }) {
  return (
    <div className="shared-notes-container">
      <div className="shared-notes-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Shared Notes / Todo Checklist</span>
      </div>
      <textarea
        className="shared-notes-textarea"
        value={notes}
        onChange={(e) => updateNotes(e.target.value)}
        placeholder="Type here to collaborate on notes or a checklist with everyone in the room..."
      />
    </div>
  );
}
