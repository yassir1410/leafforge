import { create } from 'zustand';

const defaultSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  lineNumbers: 'on',
  minimap: false,
  defaultCompiler: 'latexmk',
  autoSave: true,
  autoSaveDelay: 1500,
};

const loadSettings = () => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem('leafforge_settings');
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
};

export const useSettingsStore = create((set, get) => ({
  ...loadSettings(),

  updateSetting: (key, value) => {
    set((state) => {
      const next = { ...state, [key]: value };
      if (typeof window !== 'undefined') {
        const { updateSetting, resetSettings, ...savedFields } = next;
        localStorage.setItem('leafforge_settings', JSON.stringify(savedFields));
      }
      return next;
    });
  },

  resetSettings: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leafforge_settings', JSON.stringify(defaultSettings));
    }
    set(defaultSettings);
  },
}));
