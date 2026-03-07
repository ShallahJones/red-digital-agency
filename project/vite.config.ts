import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

function copyPublicSafe(): Plugin {
  return {
    name: 'copy-public-safe',
    apply: 'build',
    closeBundle() {
      const publicDir = path.resolve(__dirname, 'public');
      const outDir = path.resolve(__dirname, 'dist');
      function copyDir(src: string, dest: string) {
        let entries: fs.Dirent[] = [];
        try { entries = fs.readdirSync(src, { withFileTypes: true }); } catch { return; }
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            try { fs.copyFileSync(srcPath, destPath); } catch {}
          }
        }
      }
      copyDir(publicDir, outDir);
    },
  };
}

export default defineConfig({
  publicDir: false,
  plugins: [
    react(),
    copyPublicSafe(),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
