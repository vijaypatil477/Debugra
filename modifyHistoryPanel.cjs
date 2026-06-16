const fs = require('fs');
const file = 'd:/Debugra/src/components/Editor/HistoryPanel.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace('import toast from \'react-hot-toast\';', 
  'import toast from \'react-hot-toast\';\n' +
  'import { exportAsZip } from \'../../utils/exportHistory\';\n' +
  'import { createGistsFromHistory } from \'../../services/gistService\';\n' +
  'import GistAuthModal from \'./GistAuthModal\';\n' +
  'import ExportProgressModal from \'./ExportProgressModal\';\n' +
  'import { isSecureGistTokenStored } from \'../../services/secureGistTokenStore\';'
);

// 2. Add state and functions
const loadHistoryIdx = content.indexOf('const loadHistory = async () => {');
const injection = `
  const [showGistAuth, setShowGistAuth] = useState(false);
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [exportUrls, setExportUrls] = useState([]);
  const [exportError, setExportError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportZip = async () => {
    setShowExportMenu(false);
    try {
      await exportAsZip(history);
      toast.success('ZIP download started');
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  };

  const handleExportGistClick = () => {
    setShowExportMenu(false);
    if (isSecureGistTokenStored()) {
      startGistExport();
    } else {
      setShowGistAuth(true);
    }
  };

  const startGistExport = async () => {
    setShowGistAuth(false);
    setShowExportProgress(true);
    setExportProgress({ completed: 0, total: 1, percentage: 0 });
    setExportUrls([]);
    setExportError('');

    try {
      const urls = await createGistsFromHistory(history, false, setExportProgress);
      setExportUrls(urls);
      toast.success('Gist exported successfully');
    } catch (err) {
      setExportError(err.message || 'Gist export failed');
    }
  };

`;
content = content.substring(0, loadHistoryIdx) + injection + content.substring(loadHistoryIdx);

// 3. Add UI Button
const actionDivIdx = content.indexOf('<div className="d-flex gap-1">');
const uiInjection = `
          <div className="dropdown position-relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn btn-link btn-sm p-1 text-secondary history-action-btn"
              title="Export"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            {showExportMenu && (
              <div className="dropdown-menu dropdown-menu-end show position-absolute bg-dark border-secondary shadow-lg" style={{ right: 0, top: '100%', zIndex: 1000, minWidth: '160px' }}>
                <button className="dropdown-item text-light hover-bg-secondary text-sm py-2" onClick={handleExportZip}>
                  Download as ZIP
                </button>
                <button className="dropdown-item text-light hover-bg-secondary text-sm py-2" onClick={handleExportGistClick}>
                  Publish to Gist
                </button>
              </div>
            )}
          </div>
`;
content = content.replace('<div className="d-flex gap-1">', '<div className="d-flex gap-1">' + uiInjection);

// 4. Add modals
const returnIdx = content.lastIndexOf('</div>');
const modalInjection = `
      {showGistAuth && (
        <GistAuthModal 
          onClose={() => setShowGistAuth(false)} 
          onStatusChange={() => {
            if (isSecureGistTokenStored()) startGistExport();
          }}
        />
      )}
      
      {showExportProgress && (
        <ExportProgressModal 
          progress={exportProgress}
          urls={exportUrls}
          error={exportError}
          onClose={() => setShowExportProgress(false)}
        />
      )}
`;
// replace the LAST </div> with modalInjection + </div>
content = content.substring(0, returnIdx) + modalInjection + content.substring(returnIdx);

fs.writeFileSync(file, content);
console.log('HistoryPanel.jsx updated successfully');
