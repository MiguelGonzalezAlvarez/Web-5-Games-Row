import { useEffect, useState } from 'react';
import { api } from '../../utils/api';

export default function ThemeInit() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    async function initTheme() {
      try {
        const data = await api.getProviders();
        const provider = data.current_provider || 'demo';
        document.documentElement.setAttribute('data-api', provider);
      } catch (err) {
        console.error('Failed to init theme:', err);
        document.documentElement.setAttribute('data-api', 'demo');
      }
    }
    
    initTheme();
  }, []);

  return null;
}
