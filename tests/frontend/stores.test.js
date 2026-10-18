import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../../src/stores/useProjectStore';
import { useEditorStore } from '../../src/stores/useEditorStore';
import { useUIStore } from '../../src/stores/useUIStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';

describe('useProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      project: null,
      fileTree: null,
      recentProjects: [],
      isLoading: false,
      error: null,
    });
  });

  it('creates project and updates state', async () => {
    const proj = await useProjectStore.getState().createProject('/mock/paper', 'Paper Title');
    expect(proj.name).toBe('Paper Title');
    expect(useProjectStore.getState().project).toEqual(proj);
    expect(useProjectStore.getState().fileTree).toBeTruthy();
  });

  it('opens existing project', async () => {
    const proj = await useProjectStore.getState().openProject('/mock/existing');
    expect(proj.path).toBe('/mock/existing');
    expect(useProjectStore.getState().project).toEqual(proj);
  });
});

describe('useEditorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      tabs: [],
      activeTabId: null,
      pendingCloseTab: null,
    });
    useProjectStore.setState({
      project: { name: 'Test', path: '/test', main_file: '/test/main.tex' },
    });
  });

  it('opens a file in a new tab and sets activeTabId', async () => {
    await useEditorStore.getState().openFile('/test/main.tex', 'main.tex');
    const state = useEditorStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].name).toBe('main.tex');
    expect(state.activeTabId).toBe('/test/main.tex');
    expect(state.tabs[0].isDirty).toBe(false);
  });

  it('tracks dirty state when content is updated', async () => {
    await useEditorStore.getState().openFile('/test/main.tex', 'main.tex');
    useEditorStore.getState().updateContent('/test/main.tex', '\\section{Changed}');

    const tab = useEditorStore.getState().getActiveTab();
    expect(tab.isDirty).toBe(true);
    expect(tab.content).toBe('\\section{Changed}');
  });

  it('saves file and clears dirty flag', async () => {
    await useEditorStore.getState().openFile('/test/main.tex', 'main.tex');
    useEditorStore.getState().updateContent('/test/main.tex', '\\section{Changed}');
    expect(useEditorStore.getState().getActiveTab().isDirty).toBe(true);

    await useEditorStore.getState().saveTab('/test/main.tex');
    expect(useEditorStore.getState().getActiveTab().isDirty).toBe(false);
  });

  it('prevents closing dirty tab without confirmation', async () => {
    await useEditorStore.getState().openFile('/test/main.tex', 'main.tex');
    useEditorStore.getState().updateContent('/test/main.tex', '\\section{Modified}');

    useEditorStore.getState().requestCloseTab('/test/main.tex');
    expect(useEditorStore.getState().pendingCloseTab).toBeTruthy();
    expect(useEditorStore.getState().tabs.length).toBe(1);

    // Dismiss dialog
    useEditorStore.getState().dismissCloseDialog();
    expect(useEditorStore.getState().pendingCloseTab).toBeNull();

    // Force close
    useEditorStore.getState().closeTab('/test/main.tex', true);
    expect(useEditorStore.getState().tabs.length).toBe(0);
  });

  it('switches active tab cleanly when closing active tab', async () => {
    await useEditorStore.getState().openFile('/test/tab1.tex', 'tab1.tex');
    await useEditorStore.getState().openFile('/test/tab2.tex', 'tab2.tex');
    expect(useEditorStore.getState().activeTabId).toBe('/test/tab2.tex');

    useEditorStore.getState().closeTab('/test/tab2.tex', true);
    expect(useEditorStore.getState().activeTabId).toBe('/test/tab1.tex');
  });
});

describe('useUIStore', () => {
  it('toggles theme correctly', () => {
    useUIStore.setState({ theme: 'dark' });
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('light');
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('clamps panel widths within valid constraints', () => {
    useUIStore.getState().setExplorerWidth(100); // below min 160
    expect(useUIStore.getState().explorerWidth).toBe(160);

    useUIStore.getState().setExplorerWidth(800); // above max 500
    expect(useUIStore.getState().explorerWidth).toBe(500);
  });
});

describe('useSettingsStore', () => {
  it('updates editor settings and persists', () => {
    useSettingsStore.getState().updateSetting('fontSize', 18);
    expect(useSettingsStore.getState().fontSize).toBe(18);

    useSettingsStore.getState().updateSetting('defaultCompiler', 'xelatex');
    expect(useSettingsStore.getState().defaultCompiler).toBe('xelatex');
  });
});
