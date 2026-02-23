import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// Local dev mock for /api/chat - simulates SSE streaming
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
        req.on("data", (chunk: string) => (body += chunk));
        req.on("end", () => {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");

          const words =
            "AI chat works in production. Deploy to Vercel with OPENAI_API_KEY to enable real responses.".split(
              " "
            );
          let i = 0;
          const interval = setInterval(() => {
            if (i < words.length) {
              const content = (i === 0 ? "" : " ") + words[i];
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
              i++;
            } else {
              res.write("data: [DONE]\n\n");
              res.end();
              clearInterval(interval);
            }
          }, 50);
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
