import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LANGUAGES } from '../../utils/languageConfig';

/**
 * LanguageSelector – a premium custom dropdown that renders react-icons
 * next to each language name.
 *
 * The menu is rendered via a React portal at document.body level and
 * positioned with `position: fixed` so it escapes any ancestor with
 * `overflow: hidden / auto` (e.g. the toolbar).
 */
export default function LanguageSelector({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  // Recalculate position whenever the menu opens
  const openMenu = () => {
    if (disabled) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  const handleToggle = () => (open ? closeMenu() : openMenu());

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  const currentLang = LANGUAGES[value];
  const CurrentIcon = currentLang?.icon;

  const handleSelect = (key) => {
    onChange(key);
    closeMenu();
  };

  const menu = open
    ? createPortal(
        <ul
          className="lang-dropdown-menu"
          role="listbox"
          aria-label="Select language"
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            minWidth: menuPos.width,
          }}
          // Prevent the document mousedown handler from firing on the menu itself
          onMouseDown={(e) => e.stopPropagation()}
        >
          {Object.entries(LANGUAGES).map(([key, lang]) => {
            const Icon = lang.icon;
            const isSelected = key === value;
            return (
              <li
                key={key}
                role="option"
                aria-selected={isSelected}
                className={`lang-dropdown-item${isSelected ? ' selected' : ''}`}
                onClick={() => handleSelect(key)}
              >
                {Icon && (
                  <span className="lang-dropdown-item-icon">
                    <Icon size={16} />
                  </span>
                )}
                <span className="lang-dropdown-item-label">{lang.name}</span>
                {isSelected && (
                  <svg
                    className="lang-dropdown-item-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>,
        document.body
      )
    : null;

  return (
    <>
      <div className={`lang-dropdown${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}>
        {/* Trigger button */}
        <button
          ref={triggerRef}
          type="button"
          className="lang-dropdown-trigger"
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Language: ${currentLang?.name ?? value}`}
          disabled={disabled}
        >
          {CurrentIcon && (
            <span className="lang-dropdown-icon">
              <CurrentIcon size={15} />
            </span>
          )}
          <span className="lang-dropdown-label">{currentLang?.name ?? value}</span>
          <svg
            className="lang-dropdown-caret"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Menu rendered at body level to escape overflow clipping */}
      {menu}
    </>
  );
}
