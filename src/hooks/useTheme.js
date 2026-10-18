import { useEffect } from 'react';
import { useUIStore } from '../stores/useUIStore';

export function useTheme() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return { theme, setTheme };
}
