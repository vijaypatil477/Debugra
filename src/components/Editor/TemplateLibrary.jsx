import React, { useState, useMemo } from "react";
import templatesData from "../../data/templates.json";

/**
 * TemplateLibrary
 * A searchable, categorized panel of boilerplate code snippets.
 * Clicking a template calls onInsert(code) to inject into Monaco editor.
 */
export default function TemplateLibrary({ isOpen, onClose, onInsert, currentLanguage }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [copiedId, setCopiedId]     = useState(null);
  const [savedVersion, setSavedVersion] = useState(0);

  const categories = templatesData.categories;

  const filteredTemplates = useMemo(() => {
    const query = search.toLowerCase().trim();
    let all = categories.flatMap((cat) =>
      cat.templates.map((t) => ({ ...t, categoryId: cat.id, categoryLabel: cat.label, badge: cat.badge }))
    );
    if (activeCategory !== "all") {
      all = all.filter((t) => t.categoryId === activeCategory);
    }
    if (query) {
      all = all.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return all;
  }, [search, activeCategory, categories]);

  const savedTemplates = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("debugra_custom_templates") || "[]");
    } catch {
      return [];
    }
  }, [savedVersion]);

  const handleInsert = (code) => {
    onInsert(code);
    onClose();
  };

  const handleCopy = (id, code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }).catch(() => {
      console.warn("Clipboard write failed");
    });
  };

  const handleDeleteSaved = (index) => {
    const saved = JSON.parse(localStorage.getItem("debugra_custom_templates") || "[]");
    saved.splice(index, 1);
    localStorage.setItem("debugra_custom_templates", JSON.stringify(saved));
    setSavedVersion((v) => v + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="tl-overlay" role="dialog" aria-modal="true" aria-label="Template Library" aria-labelledby="tl-title-id">
      <div className="tl-backdrop" onClick={onClose} />
      <div className="tl-panel">
        <div className="tl-header">
          <span className="tl-title">
            <span className="tl-title-icon">✦</span>
            <span id="tl-title-id">Template Library</span>
          </span>
          <button className="tl-close-btn" onClick={onClose} aria-label="Close template library">✕</button>
        </div>

        <div className="tl-search-wrapper">
          <span className="tl-search-icon">⟡</span>
          <input
            className="tl-search"
            type="text"
            placeholder="Search templates... (e.g. binary search, express)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            aria-label="Search templates"
          />
          {search && (
            <button className="tl-search-clear" onClick={() => setSearch("")} aria-label="Clear search">✕</button>
          )}
        </div>

        <div className="tl-tabs" role="tablist">
          <button
            className={`tl-tab ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
            role="tab"
            aria-selected={activeCategory === "all"}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`tl-tab ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
              role="tab"
              aria-selected={activeCategory === cat.id}
            >
              <span className="tl-tab-badge">{cat.badge}</span> {cat.label}
            </button>
          ))}
        </div>

        <div className="tl-grid" role="list">
          {filteredTemplates.length === 0 && (
            <div className="tl-empty">
              <span>No templates found for "<strong>{search}</strong>"</span>
            </div>
          )}
          {filteredTemplates.map((t) => (
            <div key={t.id} className="tl-card" role="listitem">
              <div className="tl-card-top">
                <span className="tl-card-badge">{t.badge}</span>
                <span className="tl-card-name">{t.name}</span>
              </div>
              <div className="tl-card-tags">
                {t.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="tl-tag">{tag}</span>
                ))}
              </div>
              <div className="tl-card-actions">
                <button
                  className="tl-btn-copy"
                  onClick={() => handleCopy(t.id, t.code)}
                  aria-label={`Copy ${t.name}`}
                >
                  {copiedId === t.id ? "✓ Copied" : "⟡ Copy"}
                </button>
                <button
                  className="tl-btn-insert"
                  onClick={() => handleInsert(t.code)}
                  aria-label={`Insert ${t.name} into editor`}
                >
                  ✦ Insert
                </button>
              </div>
            </div>
          ))}
        </div>

        {savedTemplates.length > 0 && (
          <div className="tl-saved-section">
            <div className="tl-saved-header">⭐ My Saved Templates ({savedTemplates.length})</div>
            <div className="tl-grid">
              {savedTemplates.map((t, i) => (
                <div key={i} className="tl-card tl-card-saved" role="listitem">
                  <div className="tl-card-top">
                    <span className="tl-card-badge">MY</span>
                    <span className="tl-card-name">{t.name}</span>
                  </div>
                  <div className="tl-card-actions">
                    <button className="tl-btn-copy" onClick={() => handleCopy(`saved-${i}`, t.code)}>
                      {copiedId === `saved-${i}` ? "✓ Copied" : "⟡ Copy"}
                    </button>
                    <button className="tl-btn-insert" onClick={() => handleInsert(t.code)}>✦ Insert</button>
                    <button className="tl-btn-delete" onClick={() => handleDeleteSaved(i)} aria-label="Delete saved template">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
