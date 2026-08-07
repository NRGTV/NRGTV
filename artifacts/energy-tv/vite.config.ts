import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PORT is only required in dev/preview — build doesn't need it
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5000;

// BASE_PATH defaults to "/" so the build works without any env var
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["pwa-192.svg", "pwa-512.svg", "apple-touch-icon.svg", "favicon.svg"],
      manifest: {
        name: "NRGTV",
        short_name: "NRGTV",
        description: "Stream movies and TV shows — powered by NRGTV",
        theme_color: "#39FF14",
        background_color: "#0a0b0f",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: basePath,
        scope: basePath,
        lang: "en",
        categories: ["entertainment"],
        icons: [
          { src: "pwa-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
          { src: "pwa-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
          { src: "pwa-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
          { src: "apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
        ],
        screenshots: [
          {
            src: "pwa-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            form_factor: "wide",
            label: "NRGTV home screen",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2,ttf}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tmdb-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.themoviedb\.org\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "tmdb-api",
              expiration: { maxEntries: 100, maxAgeSeconds: 10 * 60 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 8,
            },
          },
        ],
      },
    }),
    // Replit plugins: only loaded when running inside Replit (REPL_ID is set)
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({ root: path.resolve(__dirname, "..") })
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Ensure broad browser compatibility
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["wouter"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
