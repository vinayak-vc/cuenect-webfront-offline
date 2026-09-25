import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-version-transform',
      transformIndexHtml(html) {
        return html.replace(/%APP_VERSION%/g, packageJson.version);
      }
    }
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  }
});
