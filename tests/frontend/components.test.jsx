import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toolbar } from '../../src/components/layout/Toolbar';
import { PreviewPlaceholder } from '../../src/components/preview/PreviewPlaceholder';
import { FileIcon } from '../../src/components/common/FileIcon';
import { useUIStore } from '../../src/stores/useUIStore';

describe('UI Component Rendering', () => {
  it('renders Toolbar with LeafForge branding and Phase 02 badge', () => {
    render(<Toolbar onUndo={() => {}} onRedo={() => {}} />);
    expect(screen.getByText('LeafForge')).toBeInTheDocument();
    expect(screen.getByText('Phase 02')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recompile/i })).toBeDisabled();
  });

  it('renders PreviewPlaceholder with architectural explanation', () => {
    useUIStore.setState({ isPreviewOpen: true });
    render(<PreviewPlaceholder />);
    expect(screen.getByText('PDF Preview Pipeline')).toBeInTheDocument();
    expect(screen.getByText(/Phase 02:/)).toBeInTheDocument();
  });

  it('renders FileIcon for .tex and .bib correctly', () => {
    const { container: texContainer } = render(<FileIcon extension="tex" />);
    expect(texContainer.querySelector('svg')).toBeInTheDocument();

    const { container: bibContainer } = render(<FileIcon extension="bib" />);
    expect(bibContainer.querySelector('svg')).toBeInTheDocument();
  });
});
