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
      includeAssets: ["pwa-192.png", "pwa-512.png", "pwa-maskable-512.png", "apple-touch-icon.png", "favicon.svg", "favicon.ico"],
      manifest: {
        name: "NRGTV",
        short_name: "NRGTV",
        description: "Stream movies and TV shows — powered by NRGTV",
        theme_color: "#39FF14",
        background_color: "#0a0b0f",
        display: "standalone",
        orientation: "any",
        start_url: basePath,
        scope: basePath,
        lang: "en",
        categories: ["entertainment"],
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
        screenshots: [
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "NRGTV home screen",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2,ttf}"],
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
          // Deliberately NOT routing api.themoviedb.org through the service
          // worker. Firefox has a known flaky pattern where a SW intercepting
          // a cross-origin fetch occasionally fails to relay the response
          // back through respondWith(); Workbox then has no cached fallback
          // (nothing's been cached yet) and throws its own "no-response"
          // error, which Firefox confusingly reports as a CORS failure. This
          // manifested as TMDB movie data vanishing entirely, more easily
          // triggered under the extra concurrent requests a signed-in boot
          // makes (session check, profile fetch). react-query already caches
          // this JSON in memory for 5 minutes (see STALE in useMedia.ts), so
          // SW-level caching wasn't adding much — letting these requests hit
          // the network directly, unintercepted, is both simpler and more
          // reliable.
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
