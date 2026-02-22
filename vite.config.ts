import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// Local dev mock for /api/chat (Vercel serverless functions only run in production)
function apiMockPlugin(): Plugin {
  return {
    name: "api-mock",
    configureServer(server) {
      server.middlewares.use("/api/chat", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              reply:
                "AI chat is available in production. Deploy to Vercel with OPENAI_API_KEY to enable it.",
            })
          );
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiMockPlugin()],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["import", "global-builtin", "color-functions"],
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          "react-three": ["@react-three/fiber", "@react-three/drei"],
          motion: ["motion"],
          gsap: ["gsap"],
          mediapipe: ["@mediapipe/tasks-vision"],
        },
      },
    },
  },
});
