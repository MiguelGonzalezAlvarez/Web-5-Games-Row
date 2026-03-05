import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    ssr: {
      noExternal: ['@tanstack/react-query', 'zustand', 'framer-motion'],
    },
    build: {
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'motion': ['framer-motion'],
            'query': ['@tanstack/react-query'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion', '@tanstack/react-query'],
    },
  },
});
