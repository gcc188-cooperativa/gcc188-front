/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Mesma origem da produção (D28): /api vai para o backend local.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8080" } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          mantine: [
            "@mantine/core",
            "@mantine/form",
            "@mantine/hooks",
            "@mantine/modals",
            "@mantine/notifications",
          ],
          dados: ["@tanstack/react-query", "openapi-fetch", "dayjs"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    env: { VITE_API_BASE: "http://localhost/api/v1" },
    setupFiles: ["src/test/setup.ts"],
    // Suítes com MSW + Mantine ficam mais lentas quando o Vitest paraleliza arquivos.
    testTimeout: 20000,
    // RNF-11: pelo menos 60% das linhas em shared/lib, shared/permissions e hooks (aqui: permissions e ui).
    coverage: {
      include: ["src/shared/**", "src/features/auth/**"],
      exclude: ["src/shared/api/schema.d.ts", "**/*.test.*"],
      thresholds: { lines: 60 },
    },
  },
});
