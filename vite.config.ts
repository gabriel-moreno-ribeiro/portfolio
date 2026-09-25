import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// Local dev mock for /api/chat - simulates SSE streaming
function apiMockPlugin(): Plugin {
  return {
    name: "api-mock",
    configureServer(server) {
      // Em dev não há Vercel Function: responde ok depois de um respiro, para os
      // estados de enviando/enviado do formulário poderem ser vistos.
      server.middlewares.use("/api/contact", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        req.on("data", () => {});
        req.on("end", () => {
          setTimeout(() => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, mock: true }));
          }, 600);
        });
      });
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
  define: {
    // Rodapé: "site updated X ago"
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('vite/preload-helper')) return 'vendor-react';
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/') || id.includes('node_modules/zustand/')) return 'vendor-react';
          if (id.includes('node_modules/three/')) return 'three';
          if (id.includes('node_modules/@react-three/')) return 'react-three';
          if (id.includes('node_modules/motion/') || id.includes('node_modules/framer-motion/')) return 'motion';
          if (id.includes('node_modules/gsap/')) return 'gsap';
          if (id.includes('node_modules/@mediapipe/')) return 'mediapipe';
          if (id.includes('node_modules/posthog-js/')) return 'posthog';
        },
      },
    },
  },
});
