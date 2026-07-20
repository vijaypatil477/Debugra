import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import FileIcon from '../Icons/FileIcon';
import { LANGUAGES } from '../../utils/languageConfig';
import { LANG_FILE_NAMES } from '../../config/constants';

export default function LanguageDropdown({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLang = LANGUAGES[value] || LANGUAGES.python;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (key) => {
    if (disabled) return;
    onChange(key);
    setIsOpen(false);
  };

  return (
    <div className="lang-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="lang-dropdown-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="lang-dropdown-trigger-content">
          <FileIcon filename={LANG_FILE_NAMES[value] || 'main.txt'} size={15} />
          <span className="lang-name">{activeLang.name}</span>
        </span>
        <ChevronDown size={14} className={`lang-dropdown-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <ul className="lang-dropdown-menu" role="listbox">
          {Object.entries(LANGUAGES).map(([key, lang]) => {
            const isSelected = key === value;
            return (
              <li
                key={key}
                role="option"
                aria-selected={isSelected}
                className={`lang-dropdown-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelect(key)}
              >
                <span className="lang-dropdown-item-content">
                  <FileIcon filename={LANG_FILE_NAMES[key] || 'main.txt'} size={15} />
                  <span className="lang-item-name">{lang.name}</span>
                </span>
                {isSelected && <Check size={13} className="lang-item-check" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
