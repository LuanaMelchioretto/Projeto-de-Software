import { fileURLToPath } from "node:url";
import { createServer } from "vite";

export function createComponentServer() {
  return createServer({
    root: fileURLToPath(new URL("../..", import.meta.url)),
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    ssr: {
      noExternal: ["react-router-dom", "react-router", "lucide-react"],
      resolve: { conditions: ["module", "node", "module-sync", "development"] },
    },
  });
}
