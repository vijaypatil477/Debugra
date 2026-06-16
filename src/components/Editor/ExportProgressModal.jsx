export default function ExportProgressModal({ progress, urls, onClose, error }) {
  const isComplete = progress?.completed === progress?.total || urls?.length > 0;
  
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '400px' }}>
        <div className="modal-header-row">
          <h2 className="modal-title-left">Exporting to Gist</h2>
          {isComplete && (
            <button className="modal-close-btn" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        
        <div className="p-3">
          {error ? (
            <div className="alert alert-danger x-small mb-0">
              {error}
            </div>
          ) : !isComplete ? (
            <>
              <div className="d-flex justify-content-between mb-1 x-small text-secondary">
                <span>Uploading files...</span>
                <span>{progress?.percentage || 0}%</span>
              </div>
              <div className="progress" style={{ height: '8px', backgroundColor: 'var(--bg-elevated)' }}>
                <div 
                  className="progress-bar bg-info progress-bar-striped progress-bar-animated" 
                  role="progressbar" 
                  style={{ width: `${progress?.percentage || 0}%` }}
                ></div>
              </div>
              <p className="x-small text-secondary mt-2 text-center">
                Processing chunk {progress?.completed || 0} of {progress?.total || 1}...
              </p>
            </>
          ) : (
            <div className="text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="mb-2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h5 className="mb-3">Export Complete!</h5>
              <div className="d-flex flex-column gap-2 text-start">
                {urls?.map((url, i) => (
                  <a 
                    key={i} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-sm btn-outline-info text-truncate"
                  >
                    {url}
                  </a>
                ))}
              </div>
              <button className="btn btn-primary w-100 mt-4" onClick={onClose}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
