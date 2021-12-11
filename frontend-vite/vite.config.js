// vite.config.js
import { createVuePlugin } from "vite-plugin-vue2";

export default {
	plugins: [createVuePlugin(/* options */)],
	build: {
		outDir: "../public-vite"
	},
	server: {
		port: 8080
	}
};
