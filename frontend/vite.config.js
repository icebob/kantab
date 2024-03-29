import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src")
		}
	},
	build: {
		outDir: "../public",
		emptyOutDir: true,
		chunkSizeWarningLimit: 1024
	},
	server: {
		port: 8080,
		proxy: {
			"/api": "http://localhost:4000",
			"/auth": "http://localhost:4000",
			"/locales": "http://localhost:4000",
			"/graphql": "http://localhost:4000"
		}
	}
});
