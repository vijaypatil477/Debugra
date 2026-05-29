import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SHORTCUT_GROUPS = [
  {
    title: 'Editing',
    items: [
      { label: 'Toggle line comment', combos: [['Ctrl', '/']] },
      { label: 'Trigger autocomplete', combos: [['Ctrl', 'Space']] },
      { label: 'Select next occurrence', combos: [['Ctrl', 'D']] },
      { label: 'Move line up/down', combos: [['Alt', '↑'], ['Alt', '↓']] },
      { label: 'Format document', combos: [['Shift', 'Alt', 'F']] },
    ],
  },
  {
    title: 'File',
    items: [
      { label: 'Save', combos: [['Ctrl', 'S']] },
      { label: 'Save all', combos: [['Ctrl', 'Shift', 'S']] },
      { label: 'Quick open file', combos: [['Ctrl', 'P']] },
    ],
  },
  {
    title: 'Search',
    items: [
      { label: 'Find', combos: [['Ctrl', 'F']] },
      { label: 'Replace', combos: [['Ctrl', 'H']] },
      { label: 'Find in files', combos: [['Ctrl', 'Shift', 'F']] },
    ],
  },
  {
    title: 'View',
    items: [
      { label: 'Toggle sidebar', combos: [['Ctrl', 'B']] },
      { label: 'Toggle terminal', combos: [['Ctrl', '`']] },
      { label: 'Split editor', combos: [['Ctrl', '\\']] },
    ],
  },
];

const styles = `
.keyboard-shortcuts-trigger {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
}

.keyboard-shortcuts-root {
  --bg: rgba(8, 11, 17, 0.72);
  --surface: #111827;
  --text: #f8fafc;
  --muted: #94a3b8;
  --accent: #60a5fa;
  --border: rgba(255, 255, 255, 0.12);
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}

.keyboard-shortcuts-root.is-open {
  opacity: 1;
  pointer-events: auto;
}

:root.dark .keyboard-shortcuts-root {
  --bg: rgba(4, 8, 15, 0.78);
  --surface: #111827;
  --text: #f8fafc;
  --muted: #94a3b8;
  --accent: #60a5fa;
  --border: rgba(255, 255, 255, 0.12);
}

@media (prefers-color-scheme: light) {
  .keyboard-shortcuts-root {
    --bg: rgba(241, 245, 249, 0.82);
    --surface: #ffffff;
    --text: #0f172a;
    --muted: #475569;
    --accent: #2563eb;
    --border: rgba(15, 23, 42, 0.12);
  }
}

.keyboard-shortcuts-backdrop {
  position: absolute;
  inset: 0;
  background: var(--bg);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.keyboard-shortcuts-dialog {
  position: relative;
  z-index: 1;
  width: min(760px, calc(100vw - 2rem));
  max-height: min(82dvh, 760px);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
  transform: translateY(12px) scale(0.96);
  opacity: 0;
  transition: opacity 180ms ease, transform 180ms ease;
}

.keyboard-shortcuts-root.is-open .keyboard-shortcuts-dialog {
  transform: translateY(0) scale(1);
  opacity: 1;
}

.keyboard-shortcuts-shell {
  display: flex;
  flex-direction: column;
  max-height: min(82dvh, 760px);
}

.keyboard-shortcuts-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0.875rem;
  border-bottom: 1px solid var(--border);
}

.keyboard-shortcuts-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.keyboard-shortcuts-title h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.keyboard-shortcuts-title p {
  margin: 0;
  color: var(--muted);
  font-size: 0.86rem;
}

.keyboard-shortcuts-close {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  transition: transform 150ms ease, background-color 150ms ease, border-color 150ms ease;
}

.keyboard-shortcuts-close:hover {
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(96, 165, 250, 0.4);
  transform: translateY(-1px);
}

.keyboard-shortcuts-body {
  overflow: auto;
  padding: 1rem 1.25rem 1.25rem;
}

.keyboard-shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.keyboard-shortcuts-section {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 0.9rem;
  background: rgba(255, 255, 255, 0.02);
}

.keyboard-shortcuts-section h3 {
  margin: 0 0 0.8rem;
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.keyboard-shortcuts-list {
  display: grid;
  gap: 0.65rem;
}

.keyboard-shortcuts-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--text);
  font-size: 0.9rem;
}

.keyboard-shortcuts-label {
  min-width: 0;
  color: var(--text);
}

.keyboard-shortcuts-combos {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.keyboard-shortcuts-combo {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.keyboard-shortcuts-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  min-height: 2rem;
  padding: 0.14rem 0.5rem;
  border: 1px solid var(--border);
  border-bottom-width: 2px;
  border-radius: 9px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 2px 6px rgba(0, 0, 0, 0.16);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
  white-space: nowrap;
}

.keyboard-shortcuts-separator {
  color: var(--muted);
  font-size: 0.85rem;
  margin: 0 0.1rem;
}

@media (max-width: 720px) {
  .keyboard-shortcuts-root {
    padding: 0.75rem;
  }

  .keyboard-shortcuts-dialog {
    width: calc(100vw - 1.5rem);
    max-height: calc(100dvh - 1.5rem);
  }

  .keyboard-shortcuts-shell {
    max-height: calc(100dvh - 1.5rem);
  }

  .keyboard-shortcuts-header {
    padding: 1rem 1rem 0.85rem;
  }

  .keyboard-shortcuts-body {
    padding: 0.85rem 1rem 1rem;
  }

  .keyboard-shortcuts-grid {
    grid-template-columns: 1fr;
  }

  .keyboard-shortcuts-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .keyboard-shortcuts-combos {
    justify-content: flex-start;
  }
}
`;

function isEditableElement(element) {
  if (!(element instanceof HTMLElement)) return false;
  const tagName = element.tagName;
  return element.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',')
    )
  ).filter((element) => element instanceof HTMLElement && element.getClientRects().length > 0);
}

function renderCombo(combo) {
  return combo.map((key, index) => (
    <span className="keyboard-shortcuts-combo" key={`${key}-${index}`}>
      <span className="keyboard-shortcuts-key">{key}</span>
      {index < combo.length - 1 ? <span className="keyboard-shortcuts-separator">+</span> : null}
    </span>
  ));
}

export default function KeyboardShortcutsModal() {
  const [isRendered, setIsRendered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const closeTimerRef = useRef(null);
  const returnFocusRef = useRef(null);

  const openModal = useCallback((focusTarget) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    returnFocusRef.current =
      focusTarget instanceof HTMLElement &&
      focusTarget !== document.body &&
      focusTarget !== document.documentElement
        ? focusTarget
        : triggerRef.current;

    if (!isRendered) {
      setIsRendered(true);
    }

    setIsOpen(true);
  }, [isRendered]);

  const closeModal = useCallback(() => {
    setIsOpen(false);

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      setIsRendered(false);
      closeTimerRef.current = null;

      const focusTarget = returnFocusRef.current;
      if (focusTarget instanceof HTMLElement && focusTarget.isConnected) {
        focusTarget.focus();
      } else {
        triggerRef.current?.focus();
      }
    }, 180);
  }, []);

  useEffect(() => {
    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape' && isRendered) {
        event.preventDefault();
        closeModal();
        return;
      }

      if (isRendered) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const isShortcutTrigger = event.key === '?' || (event.key === '/' && event.shiftKey);
      if (!isShortcutTrigger) return;
      if (isEditableElement(document.activeElement)) return;

      event.preventDefault();
      openModal(document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current);
    };

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [closeModal, isRendered, openModal]);

  useEffect(() => {
    if (!isRendered) return undefined;

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isRendered]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleDialogKeyDown = (event) => {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements(dialogRef.current);
    if (!focusableElements.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <>
      <style>{styles}</style>
      <button
        ref={triggerRef}
        type="button"
        className="toolbar-icon-btn keyboard-shortcuts-trigger"
        aria-label="Open keyboard shortcuts"
        aria-haspopup="dialog"
        onClick={() => openModal(triggerRef.current)}
        title="Keyboard shortcuts"
      >
        ?
      </button>

      {isRendered
        ? createPortal(
            <div className={`keyboard-shortcuts-root ${isOpen ? 'is-open' : ''}`}>
              <div
                className="keyboard-shortcuts-backdrop"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    closeModal();
                  }
                }}
              />
              <div
                ref={dialogRef}
                className="keyboard-shortcuts-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Keyboard shortcuts"
                tabIndex={-1}
                onKeyDown={handleDialogKeyDown}
              >
                <div className="keyboard-shortcuts-shell">
                  <div className="keyboard-shortcuts-header">
                    <div className="keyboard-shortcuts-title">
                      <h2>Keyboard shortcuts</h2>
                      <p>Press ? anytime to reopen this panel.</p>
                    </div>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      className="keyboard-shortcuts-close"
                      aria-label="Close keyboard shortcuts"
                      onClick={closeModal}
                    >
                      ×
                    </button>
                  </div>

                  <div className="keyboard-shortcuts-body">
                    <div className="keyboard-shortcuts-grid">
                      {SHORTCUT_GROUPS.map((group) => (
                        <section className="keyboard-shortcuts-section" key={group.title}>
                          <h3>{group.title}</h3>
                          <div className="keyboard-shortcuts-list">
                            {group.items.map((item) => (
                              <div className="keyboard-shortcuts-item" key={item.label}>
                                <span className="keyboard-shortcuts-label">{item.label}</span>
                                <div className="keyboard-shortcuts-combos" aria-label={item.label}>
                                  {item.combos.map((combo, comboIndex) => (
                                    <span className="keyboard-shortcuts-combo" key={`${item.label}-${comboIndex}`}>
                                      {renderCombo(combo)}
                                      {comboIndex < item.combos.length - 1 ? (
                                        <span className="keyboard-shortcuts-separator">/</span>
                                      ) : null}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}