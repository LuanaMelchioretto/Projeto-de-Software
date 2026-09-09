import { fileURLToPath } from "node:url";
import { createServer } from "vite";

export function createComponentServer() {
  return createServer({
    root: fileURLToPath(new URL("../..", import.meta.url)),
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    ssr: {
      noExternal: ["react-router-dom", "react-router", "lucide-react"],
      // React Router 7 publica a entrada ESM para Node sob module-sync.
      resolve: { conditions: ["module", "node", "module-sync", "development"] },
    },
  });
}
