import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../src/app/App';
import { ErrorBoundary } from '../../src/components/common/ErrorBoundary';
import { useUIStore } from '../../src/stores/useUIStore';
import { useProjectStore } from '../../src/stores/useProjectStore';
import { useEditorStore } from '../../src/stores/useEditorStore';

describe('LeafForge Application Shell & Layout Regression Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useUIStore.setState({
        theme: 'dark',
        isExplorerOpen: true,
        isPreviewOpen: true,
        isBottomPanelOpen: true,
        bottomPanelTab: 'environment',
        explorerWidth: 260,
        previewWidth: 420,
        bottomPanelHeight: 180,
      });
      useProjectStore.setState({
        project: null,
        fileTree: null,
        error: null,
      });
      useEditorStore.setState({
        tabs: [],
        activeTabId: null,
        isSaving: false,
      });
    });
  });

  it('renders the complete application shell without crashing', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('aside')).toBeInTheDocument();
  });

  it('renders Toolbar branding, actions, and compiler dropdown', () => {
    render(<App />);
    expect(screen.getByText('LeafForge')).toBeInTheDocument();
    expect(screen.getByText('v0.1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New', exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open', exact: true })).toBeInTheDocument();
    expect(screen.getByTitle(/LaTeX Compilation Engine/i)).toBeInTheDocument();
  });

  it('renders Project Explorer with action buttons in empty state', () => {
    render(<App />);
    expect(screen.getByText('Explorer')).toBeInTheDocument();
    expect(screen.getByText('No project opened')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Project/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Project/i })).toBeInTheDocument();
  });

  it('renders Editor area with empty state when no files are open', () => {
    render(<App />);
    expect(screen.getByText('No file opened in editor')).toBeInTheDocument();
    expect(screen.getByText(/LaTeX snippets: type/i)).toBeInTheDocument();
  });

  it('renders PDF Preview placeholder with roadmap callout', () => {
    render(<App />);
    expect(screen.getByText('PDF Preview')).toBeInTheDocument();
    expect(screen.getByText('PDF Preview Pipeline')).toBeInTheDocument();
    expect(screen.getByText(/Architecture Roadmap/i)).toBeInTheDocument();
  });

  it('renders Diagnostics bottom panel and tabs', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'LaTeX Environment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Output', exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Problems (0)', exact: true })).toBeInTheDocument();
    expect(screen.getByText(/Detected System LaTeX Tools/i)).toBeInTheDocument();
  });

  it('toggles light and dark themes cleanly', () => {
    render(<App />);
    const themeBtn = screen.getByTitle(/Switch to Light Mode/i);
    expect(themeBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(themeBtn);
    });

    expect(useUIStore.getState().theme).toBe('light');
    expect(screen.getByTitle(/Switch to Dark Mode/i)).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTitle(/Switch to Dark Mode/i));
    });

    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('safely handles corrupted or out-of-bounds persisted layout settings', () => {
    act(() => {
      useUIStore.getState().setExplorerWidth(-500);
      useUIStore.getState().setPreviewWidth(99999);
      useUIStore.getState().setBottomPanelHeight(10);
    });

    const state = useUIStore.getState();
    // Clamped within valid bounds: 160 <= explorer <= 500
    expect(state.explorerWidth).toBe(160);
    // Clamped: 240 <= preview <= 800
    expect(state.previewWidth).toBe(800);
    // Clamped: 90 <= bottom <= 500
    expect(state.bottomPanelHeight).toBe(90);
  });

  it('catches component-level errors with ErrorBoundary and shows recovery UI', () => {
    const FailingChild = () => {
      throw new Error('Simulated critical crash in component render');
    };

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary title="Custom Crash Title">
        <FailingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Crash Title')).toBeInTheDocument();
    expect(screen.getByText(/Simulated critical crash in component render/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload LeafForge/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset State/i })).toBeInTheDocument();

    spy.mockRestore();
  });
});
