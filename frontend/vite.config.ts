import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Binds to 0.0.0.0 instead of just localhost — lets a phone on the same
    // WiFi reach the dev server via this machine's LAN IP, not just this
    // machine itself. No effect on the production build (Docker/nginx setup
    // already listens on all interfaces there).
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query", "axios"],
          "vendor-ui": ["@radix-ui/react-avatar", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-label", "@radix-ui/react-select", "@radix-ui/react-slot", "@radix-ui/react-tabs", "framer-motion", "lucide-react"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-socket": ["socket.io-client"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
});
