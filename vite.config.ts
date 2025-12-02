import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@ui": path.resolve(__dirname, "./src/components/ui"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@data": path.resolve(__dirname, "./src/data"),
    },
  },

  server: {
    proxy: {
      "/api/hadith": {
        target: "https://hadithapi.com/api/v1",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hadith/, ""),
        headers: {
          Authorization:
            "Bearer $2y$10$YZTcZHOTtoRJkB5zlaSXKuJD4dfQiG5aIoaXdmlA8T7Zc73NgIRKy",
        },
      },
    },
  },
});
