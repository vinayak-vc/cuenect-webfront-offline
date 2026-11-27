import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all environment variables (including those from Netlify build environment)
  const env = loadEnv(mode, process.cwd(), '');

  const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const cfAccountId = env.VITE_CF_ACCOUNT_ID || env.CF_ACCOUNT_ID || process.env.VITE_CF_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || '';
  const cfApiToken = env.VITE_CF_API_TOKEN || env.CF_API_TOKEN || process.env.VITE_CF_API_TOKEN || process.env.CF_API_TOKEN || '';

  return {
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
      __APP_VERSION__: JSON.stringify(packageJson.version),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'import.meta.env.VITE_CF_ACCOUNT_ID': JSON.stringify(cfAccountId),
      'import.meta.env.CF_ACCOUNT_ID': JSON.stringify(cfAccountId),
      'import.meta.env.VITE_CF_API_TOKEN': JSON.stringify(cfApiToken),
      'import.meta.env.CF_API_TOKEN': JSON.stringify(cfApiToken),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      'process.env.VITE_CF_ACCOUNT_ID': JSON.stringify(cfAccountId),
      'process.env.CF_ACCOUNT_ID': JSON.stringify(cfAccountId),
      'process.env.VITE_CF_API_TOKEN': JSON.stringify(cfApiToken),
      'process.env.CF_API_TOKEN': JSON.stringify(cfApiToken),
    },
    envPrefix: ['VITE_', 'GEMINI_', 'CF_'],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:9000',
          changeOrigin: true
        }
      }
    },
    preview: {
      port: 3000,
      host: true
    }
  };
});
