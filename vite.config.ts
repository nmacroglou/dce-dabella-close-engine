import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const BUILD_TIME = new Date().toISOString();

// Emit a build-info.json at build time so the running app can fetch the
// production build's timestamp and compare it to its own.
function buildInfoPlugin(): Plugin {
  return {
    name: "build-info",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "build-info.json",
        source: JSON.stringify({ buildTime: BUILD_TIME }),
      });
    },
    configureServer(server) {
      server.middlewares.use("/build-info.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ buildTime: BUILD_TIME }));
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), buildInfoPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  define: {
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdf: ["jspdf"],
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
}));
