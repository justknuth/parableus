import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // Hot Module Replacement is enabled by default in Vite
      hmr: true,
      port: 3000, 
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:5001",
          changeOrigin: true,
          rewrite: (path) => `/parableus/us-central1/api${path}`,
        },
      },
    },
  };
});
