import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Safety net for stray `debugger` statements in production builds.
    // (console.log noise was already removed at the source — see
    // integrations/api/client.ts / contexts/AuthContext.tsx — and
    // console.error is kept intentionally since it's the only production
    // error visibility this app has.)
    drop: mode === "production" ? ["debugger"] : [],
  },
}));
