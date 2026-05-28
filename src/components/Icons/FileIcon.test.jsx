import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FileIcon from './FileIcon';

describe('FileIcon', () => {
  it('renders a Python icon with correct attributes for python filename', () => {
    render(<FileIcon filename="script.py" size={20} />);

    const iconContainer = screen.getByTitle('Python file');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('file-icon');

    const svgIcon = screen.getByRole('img', { name: 'Python file' });
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveAttribute('width', '20');
    expect(svgIcon).toHaveAttribute('height', '20');
  });

  it('renders a JavaScript icon for javascript filename', () => {
    render(<FileIcon filename="index.js" />);
    const iconContainer = screen.getByTitle('JavaScript file');
    expect(iconContainer).toBeInTheDocument();

    const svgIcon = screen.getByRole('img', { name: 'JavaScript file' });
    expect(svgIcon).toBeInTheDocument();
  });

  it('falls back to default CodeIcon for unknown file extension', () => {
    render(<FileIcon filename="document.pdf" />);
    const iconContainer = screen.getByTitle('Code file');
    expect(iconContainer).toBeInTheDocument();

    const svgIcon = screen.getByRole('img', { name: 'Code file' });
    expect(svgIcon).toBeInTheDocument();
  });
});
