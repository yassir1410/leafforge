import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEditorStore } from '../../src/stores/useEditorStore';
import { useProjectStore } from '../../src/stores/useProjectStore';
import * as tauriLib from '../../src/lib/tauri';

describe('Autosave and Concurrent Save Correctness', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useEditorStore.setState({
      tabs: [],
      activeTabId: null,
      pendingCloseTab: null,
      savingTabIds: new Set(),
      pendingSaveQueues: new Map(),
    });
    useProjectStore.setState({
      project: { name: 'Test Project', path: '/test/project', main_file: '/test/project/main.tex' },
    });
  });

  it('prevents an in-flight save from clearing the dirty flag if newer edits occurred', async () => {
    let resolveFirstWrite;
    const firstWritePromise = new Promise((resolve) => {
      resolveFirstWrite = resolve;
    });

    let writeCallCount = 0;
    const writeCalls = [];

    vi.spyOn(tauriLib, 'invokeCommand').mockImplementation(async (cmd, args) => {
      if (cmd === 'read_file_content') {
        return 'Initial Content';
      }
      if (cmd === 'write_file_content') {
        writeCallCount++;
        writeCalls.push({ call: writeCallCount, content: args.content });
        if (writeCallCount === 1) {
          // Block the first write until we release it
          await firstWritePromise;
          return null;
        }
        return null;
      }
      return null;
    });

    // 1. Open the file
    await useEditorStore.getState().openFile('/test/project/main.tex', 'main.tex');
    let tab = useEditorStore.getState().getActiveTab();
    expect(tab.content).toBe('Initial Content');
    expect(tab.isDirty).toBe(false);

    // 2. User types "Edit 1"
    useEditorStore.getState().updateContent('/test/project/main.tex', 'Edit 1');
    tab = useEditorStore.getState().getActiveTab();
    expect(tab.content).toBe('Edit 1');
    expect(tab.isDirty).toBe(true);

    // 3. Initiate saveTab (this writes "Edit 1" and will pause)
    const savePromise1 = useEditorStore.getState().saveTab('/test/project/main.tex');

    // Verify file is marked as saving
    expect(useEditorStore.getState().isTabSaving('/test/project/main.tex')).toBe(true);
    expect(useEditorStore.getState().isSaving).toBe(true);

    // 4. WHILE save is in-flight, user types "Edit 2 (newer)"
    useEditorStore.getState().updateContent('/test/project/main.tex', 'Edit 2 (newer)');
    tab = useEditorStore.getState().getActiveTab();
    expect(tab.content).toBe('Edit 2 (newer)');
    expect(tab.isDirty).toBe(true);

    // 5. Release first write
    resolveFirstWrite();
    await savePromise1;

    // 6. First write completed, but content in tab is "Edit 2 (newer)", so isDirty MUST remain TRUE!
    tab = useEditorStore.getState().getActiveTab();
    expect(tab.content).toBe('Edit 2 (newer)');
    expect(tab.isDirty).toBe(true);
    expect(writeCalls[0].content).toBe('Edit 1');

    // 7. Save again for the newer edits
    await useEditorStore.getState().saveTab('/test/project/main.tex');
    tab = useEditorStore.getState().getActiveTab();
    expect(tab.content).toBe('Edit 2 (newer)');
    expect(tab.isDirty).toBe(false);
    expect(writeCalls.length).toBe(2);
    expect(writeCalls[1].content).toBe('Edit 2 (newer)');
  });

  it('serializes concurrent saveTab requests for the same file', async () => {
    const executionOrder = [];
    let resolveWrite1;
    const write1Promise = new Promise((resolve) => {
      resolveWrite1 = resolve;
    });

    let callIndex = 0;
    vi.spyOn(tauriLib, 'invokeCommand').mockImplementation(async (cmd, args) => {
      if (cmd === 'read_file_content') return 'Base content';
      if (cmd === 'write_file_content') {
        callIndex++;
        const currentCall = callIndex;
        executionOrder.push(`start-${currentCall}:${args.content}`);
        if (currentCall === 1) {
          await write1Promise;
        }
        executionOrder.push(`end-${currentCall}:${args.content}`);
        return null;
      }
      return null;
    });

    await useEditorStore.getState().openFile('/test/project/doc.tex', 'doc.tex');

    useEditorStore.getState().updateContent('/test/project/doc.tex', 'First version');
    const p1 = useEditorStore.getState().saveTab('/test/project/doc.tex');

    // Rapid second call to saveTab while p1 is in-flight
    useEditorStore.getState().updateContent('/test/project/doc.tex', 'Second version');
    const p2 = useEditorStore.getState().saveTab('/test/project/doc.tex');

    // Unblock write 1
    resolveWrite1();

    await Promise.all([p1, p2]);

    // Verify strict serialization: write 1 finishes before write 2 starts
    expect(executionOrder).toEqual([
      'start-1:First version',
      'end-1:First version',
      'start-2:Second version',
      'end-2:Second version',
    ]);

    const tab = useEditorStore.getState().getActiveTab();
    expect(tab.isDirty).toBe(false);
    expect(tab.content).toBe('Second version');
  });

  it('flushPendingSaves flushes all dirty tabs and pending writes', async () => {
    const writtenFiles = [];
    vi.spyOn(tauriLib, 'invokeCommand').mockImplementation(async (cmd, args) => {
      if (cmd === 'read_file_content') return 'Initial';
      if (cmd === 'write_file_content') {
        writtenFiles.push({ path: args.file_path, content: args.content });
        return null;
      }
      return null;
    });

    await useEditorStore.getState().openFile('/test/project/file1.tex', 'file1.tex');
    await useEditorStore.getState().openFile('/test/project/file2.tex', 'file2.tex');

    useEditorStore.getState().updateContent('/test/project/file1.tex', 'Modified 1');
    useEditorStore.getState().updateContent('/test/project/file2.tex', 'Modified 2');

    expect(useEditorStore.getState().tabs[0].isDirty).toBe(true);
    expect(useEditorStore.getState().tabs[1].isDirty).toBe(true);

    await useEditorStore.getState().flushPendingSaves();

    expect(useEditorStore.getState().tabs[0].isDirty).toBe(false);
    expect(useEditorStore.getState().tabs[1].isDirty).toBe(false);
    expect(writtenFiles).toHaveLength(2);
    expect(writtenFiles.find((f) => f.path === '/test/project/file1.tex').content).toBe('Modified 1');
    expect(writtenFiles.find((f) => f.path === '/test/project/file2.tex').content).toBe('Modified 2');
  });
});
