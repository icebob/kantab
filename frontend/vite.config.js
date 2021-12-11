// vite.config.js
import { createVuePlugin } from "vite-plugin-vue2";

export default {
	plugins: [createVuePlugin(/* options */)],
	build: {
		outDir: "../public",
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
};
