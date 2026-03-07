// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import fs from "fs";
import path from "path";
var __vite_injected_original_dirname = "/home/project";
function copyPublicSafe() {
  return {
    name: "copy-public-safe",
    apply: "build",
    closeBundle() {
      const publicDir = path.resolve(__vite_injected_original_dirname, "public");
      const outDir = path.resolve(__vite_injected_original_dirname, "dist");
      function copyDir(src, dest) {
        let entries = [];
        try {
          entries = fs.readdirSync(src, { withFileTypes: true });
        } catch {
          return;
        }
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            try {
              fs.copyFileSync(srcPath, destPath);
            } catch {
            }
          }
        }
      }
      copyDir(publicDir, outDir);
    }
  };
}
var vite_config_default = defineConfig({
  publicDir: false,
  plugins: [
    react(),
    copyPublicSafe()
  ],
  optimizeDeps: {
    exclude: ["lucide-react"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdHlwZSB7IFBsdWdpbiB9IGZyb20gJ3ZpdGUnO1xuXG5mdW5jdGlvbiBjb3B5UHVibGljU2FmZSgpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdjb3B5LXB1YmxpYy1zYWZlJyxcbiAgICBhcHBseTogJ2J1aWxkJyxcbiAgICBjbG9zZUJ1bmRsZSgpIHtcbiAgICAgIGNvbnN0IHB1YmxpY0RpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdwdWJsaWMnKTtcbiAgICAgIGNvbnN0IG91dERpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdkaXN0Jyk7XG4gICAgICBmdW5jdGlvbiBjb3B5RGlyKHNyYzogc3RyaW5nLCBkZXN0OiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IGVudHJpZXM6IGZzLkRpcmVudFtdID0gW107XG4gICAgICAgIHRyeSB7IGVudHJpZXMgPSBmcy5yZWFkZGlyU3luYyhzcmMsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTsgfSBjYXRjaCB7IHJldHVybjsgfVxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGVzdCkpIGZzLm1rZGlyU3luYyhkZXN0LCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgY29uc3Qgc3JjUGF0aCA9IHBhdGguam9pbihzcmMsIGVudHJ5Lm5hbWUpO1xuICAgICAgICAgIGNvbnN0IGRlc3RQYXRoID0gcGF0aC5qb2luKGRlc3QsIGVudHJ5Lm5hbWUpO1xuICAgICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICBjb3B5RGlyKHNyY1BhdGgsIGRlc3RQYXRoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJ5IHsgZnMuY29weUZpbGVTeW5jKHNyY1BhdGgsIGRlc3RQYXRoKTsgfSBjYXRjaCB7fVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29weURpcihwdWJsaWNEaXIsIG91dERpcik7XG4gICAgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcHVibGljRGlyOiBmYWxzZSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgY29weVB1YmxpY1NhZmUoKSxcbiAgXSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBTXpDLFNBQVMsaUJBQXlCO0FBQ2hDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxJQUNQLGNBQWM7QUFDWixZQUFNLFlBQVksS0FBSyxRQUFRLGtDQUFXLFFBQVE7QUFDbEQsWUFBTSxTQUFTLEtBQUssUUFBUSxrQ0FBVyxNQUFNO0FBQzdDLGVBQVMsUUFBUSxLQUFhLE1BQWM7QUFDMUMsWUFBSSxVQUF1QixDQUFDO0FBQzVCLFlBQUk7QUFBRSxvQkFBVSxHQUFHLFlBQVksS0FBSyxFQUFFLGVBQWUsS0FBSyxDQUFDO0FBQUEsUUFBRyxRQUFRO0FBQUU7QUFBQSxRQUFRO0FBQ2hGLFlBQUksQ0FBQyxHQUFHLFdBQVcsSUFBSSxFQUFHLElBQUcsVUFBVSxNQUFNLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFDaEUsbUJBQVcsU0FBUyxTQUFTO0FBQzNCLGdCQUFNLFVBQVUsS0FBSyxLQUFLLEtBQUssTUFBTSxJQUFJO0FBQ3pDLGdCQUFNLFdBQVcsS0FBSyxLQUFLLE1BQU0sTUFBTSxJQUFJO0FBQzNDLGNBQUksTUFBTSxZQUFZLEdBQUc7QUFDdkIsb0JBQVEsU0FBUyxRQUFRO0FBQUEsVUFDM0IsT0FBTztBQUNMLGdCQUFJO0FBQUUsaUJBQUcsYUFBYSxTQUFTLFFBQVE7QUFBQSxZQUFHLFFBQVE7QUFBQSxZQUFDO0FBQUEsVUFDckQ7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUNBLGNBQVEsV0FBVyxNQUFNO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixXQUFXO0FBQUEsRUFDWCxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixlQUFlO0FBQUEsRUFDakI7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
