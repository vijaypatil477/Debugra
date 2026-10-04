import PropTypes from 'prop-types';

export default function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className="toolbar-icon-btn"
      aria-label="Toggle theme"
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      aria-pressed={isLight}
      onClick={onToggle}
    >
      <i className={isLight ? 'bi bi-sun-fill' : 'bi bi-moon-fill'} />
    </button>
  );
}

ThemeToggle.propTypes = {
  theme: PropTypes.oneOf(['light', 'dark']).isRequired,
  onToggle: PropTypes.func.isRequired,
};

