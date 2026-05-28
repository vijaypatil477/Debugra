/**
 * PromptTemplatesGallery.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A full-featured modal gallery for selecting AI personality / system-prompt
 * templates.
 *
 * Features:
 * - Responsive card grid with hover animations and selected-state glow
 * - Search/filter by title or description
 * - Category tab filters
 * - Preview modal showing full system prompt text
 * - Custom prompt textarea with auto-switching to "Custom" mode
 * - Full keyboard navigation (arrow keys, Enter/Space, Escape)
 * - ARIA: role="radiogroup", role="radio", aria-checked, aria-label
 * - Locks body scroll while open
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import './PromptTemplatesGallery.css';
import {
  PROMPT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  CUSTOM_TEMPLATE_ID,
} from '../../data/promptTemplates';

// ─── Checkmark SVG ───────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <polyline points="1.5 6 5 9.5 10.5 2.5" />
    </svg>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ template, onClose, onSelect, isSelected }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="ptg-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${template.title}`}
      onClick={onClose}
    >
      <div
        className="ptg-preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ptg-preview-header">
          <span className="ptg-preview-icon" aria-hidden="true">
            {template.icon}
          </span>
          <div className="ptg-preview-title-group">
            <h3 className="ptg-preview-title">{template.title}</h3>
            <p className="ptg-preview-desc">{template.description}</p>
          </div>
          <button
            className="ptg-preview-close"
            onClick={onClose}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        {/* System prompt body */}
        <div className="ptg-preview-body">
          <pre className="ptg-preview-prompt">{template.systemPrompt}</pre>
        </div>

        {/* Footer actions */}
        <div className="ptg-preview-footer">
          <button className="ptg-preview-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="ptg-preview-select-btn"
            style={{ background: template.accentColor }}
            onClick={() => { onSelect(template.id); onClose(); }}
            aria-pressed={isSelected}
          >
            {isSelected ? '✓ Selected' : 'Use This Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single Template Card ─────────────────────────────────────────────────────
function TemplateCard({ template, isSelected, onSelect, onPreview }) {
  const catMeta = TEMPLATE_CATEGORIES[template.category] ?? { label: template.category, color: '#6b7280' };

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-label={`${template.title}: ${template.description}`}
      tabIndex={0}
      className={`ptg-card${isSelected ? ' ptg-card--selected' : ''}`}
      style={{ '--ptg-accent': template.accentColor }}
      onClick={() => onSelect(template.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(template.id);
        }
      }}
    >
      {/* Header row: icon + checkmark */}
      <div className="ptg-card-header">
        <span className="ptg-card-icon" aria-hidden="true">
          {template.icon}
        </span>
        <span className="ptg-check" aria-hidden="true">
          <CheckIcon />
        </span>
      </div>

      {/* Body: title + description */}
      <div className="ptg-card-body">
        <div className="ptg-card-title">{template.title}</div>
        <div className="ptg-card-desc">{template.description}</div>
      </div>

      {/* Category badge + preview */}
      <div className="ptg-card-footer">
        <span
          className="ptg-badge"
          style={{
            color: catMeta.color,
            borderColor: catMeta.color + '40',
            background: catMeta.color + '18',
          }}
        >
          {catMeta.label}
        </span>

        <button
          className="ptg-preview-btn"
          aria-label={`Preview system prompt for ${template.title}`}
          onClick={(e) => { e.stopPropagation(); onPreview(template); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onPreview(template); } }}
          tabIndex={-1} /* parent card is already keyboard-navigable */
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Preview
        </button>
      </div>
    </div>
  );
}

// ─── Main Gallery Component ───────────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {boolean}  props.isOpen            - Whether the modal is visible
 * @param {Function} props.onClose           - Called to close the modal
 * @param {string}   props.selectedTemplateId - Currently selected template ID
 * @param {Function} props.onSelectTemplate  - Called with template id on selection
 * @param {string}   props.customPrompt      - Current custom prompt text
 * @param {Function} props.onCustomPromptChange - Called when custom prompt changes
 */
export default function PromptTemplatesGallery({
  isOpen,
  onClose,
  selectedTemplateId,
  onSelectTemplate,
  customPrompt,
  onCustomPromptChange,
}) {
  const [searchQuery, setSearchQuery]     = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const searchRef = useRef(null);
  const gridRef   = useRef(null);

  // ── Lock body scroll when open ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-focus search on open
      setTimeout(() => searchRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ── Close on Escape ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape' && !previewTemplate) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, previewTemplate]);

  // ── Arrow-key navigation within the card grid ───────────────────────────
  const handleGridKeyDown = useCallback((e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const cards = Array.from(gridRef.current?.querySelectorAll('[role="radio"]') ?? []);
    const idx   = cards.indexOf(document.activeElement);
    if (idx === -1) { cards[0]?.focus(); return; }

    const cols = Math.round(gridRef.current.offsetWidth / (cards[0]?.offsetWidth + 12)) || 1;
    const map  = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
    const next = cards[idx + map[e.key]];
    if (next) { e.preventDefault(); next.focus(); }
  }, []);

  // ── Filter logic ────────────────────────────────────────────────────────
  const filteredTemplates = PROMPT_TEMPLATES.filter((t) => {
    const matchSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = activeCategory === 'all' || t.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const allCategories = ['all', ...Object.keys(TEMPLATE_CATEGORIES)];

  const isCustomSelected = selectedTemplateId === CUSTOM_TEMPLATE_ID;

  if (!isOpen) return null;

  return (
    <>
      {/* ── Main Overlay ─────────────────────────────────────────────────── */}
      <div
        className="ptg-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="AI Personality Templates Gallery"
        onClick={onClose}
      >
        <div className="ptg-modal" onClick={(e) => e.stopPropagation()}>

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="ptg-header">
            <div className="ptg-header-top">
              <div>
                <h2 className="ptg-title">🤖 AI Personality Templates</h2>
                <p className="ptg-subtitle">
                  Choose a personality that shapes how the AI thinks, responds, and reviews your code.
                </p>
              </div>
              <button
                className="ptg-close-btn"
                onClick={onClose}
                aria-label="Close template gallery"
              >
                ×
              </button>
            </div>

            {/* Search + Category filters */}
            <div className="ptg-controls">
              <div className="ptg-search-wrap">
                <span className="ptg-search-icon" aria-hidden="true">🔍</span>
                <input
                  ref={searchRef}
                  type="search"
                  className="ptg-search"
                  placeholder="Search templates…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search AI personality templates"
                />
              </div>

              <div className="ptg-tabs" role="tablist" aria-label="Filter by category">
                {allCategories.map((cat) => {
                  const isActive = activeCategory === cat;
                  const meta = TEMPLATE_CATEGORIES[cat];
                  return (
                    <button
                      key={cat}
                      role="tab"
                      aria-selected={isActive}
                      className={`ptg-tab${isActive ? ' ptg-tab--active' : ''}`}
                      style={isActive && meta ? { background: meta.color, borderColor: meta.color } : {}}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat === 'all' ? 'All' : (meta?.label ?? cat)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <div className="ptg-body">

            {/* Custom Prompt Section */}
            {(activeCategory === 'all' && !searchQuery) && (
              <div className="ptg-custom-section">
                <div className="ptg-section-label">Custom Prompt</div>
                <div
                  role="radio"
                  aria-checked={isCustomSelected}
                  aria-label="Custom system prompt — write your own"
                  tabIndex={0}
                  className={`ptg-custom-card${isCustomSelected ? ' ptg-card--selected' : ''}`}
                  style={{ '--ptg-accent': 'var(--accent)' }}
                  onClick={() => onSelectTemplate(CUSTOM_TEMPLATE_ID)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTemplate(CUSTOM_TEMPLATE_ID);
                    }
                  }}
                >
                  <span className="ptg-custom-icon" aria-hidden="true">✍️</span>
                  <div className="ptg-custom-text">
                    <div className="ptg-custom-title">Custom Prompt</div>
                    <div className="ptg-custom-desc">
                      Write your own system prompt for complete control over the AI&apos;s behavior.
                    </div>
                    {/* Inline textarea when custom is selected */}
                    {isCustomSelected && (
                      <div
                        className="ptg-custom-textarea-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                          className="ptg-custom-textarea"
                          value={customPrompt}
                          onChange={(e) => onCustomPromptChange(e.target.value)}
                          placeholder="You are an expert software engineer who…"
                          aria-label="Custom system prompt text"
                          maxLength={4000}
                          rows={5}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="ptg-char-count">
                          {customPrompt.length} / 4000
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Checkmark */}
                  <span
                    className="ptg-check"
                    aria-hidden="true"
                    style={{ alignSelf: 'flex-start', marginTop: '2px', background: 'var(--accent)' }}
                  >
                    <CheckIcon />
                  </span>
                </div>
              </div>
            )}

            {/* Template Cards Grid */}
            <div className="ptg-section-label">
              {activeCategory === 'all' ? 'All Templates' : (TEMPLATE_CATEGORIES[activeCategory]?.label ?? activeCategory)}
              {' '}
              <span style={{ color: 'var(--text-2)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                ({filteredTemplates.length})
              </span>
            </div>

            <div
              className="ptg-grid"
              ref={gridRef}
              role="radiogroup"
              aria-label="AI personality templates"
              onKeyDown={handleGridKeyDown}
            >
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplateId === template.id}
                    onSelect={onSelectTemplate}
                    onPreview={setPreviewTemplate}
                  />
                ))
              ) : (
                <div className="ptg-empty" role="status">
                  <div className="ptg-empty-icon">🔎</div>
                  <div>No templates match your search.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Preview Modal (rendered on top of gallery) ─────────────────────── */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          isSelected={selectedTemplateId === previewTemplate.id}
          onClose={() => setPreviewTemplate(null)}
          onSelect={(id) => {
            onSelectTemplate(id);
            setPreviewTemplate(null);
          }}
        />
      )}
    </>
  );
}
