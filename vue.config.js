const path = require("path");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
module.exports = {
	chainWebpack: config => {
		if (process.argv.indexOf("--report") !== -1) {
			config.plugin("webpack-report").use(BundleAnalyzerPlugin, [{}]);
		}
	},

	configureWebpack: config => {
		const folder = path.join(__dirname, "frontend");
		config.entry.app = [path.join(folder, "main.js")];
		config.resolve.alias["@"] = folder;
	},

	baseUrl: undefined,
	outputDir: "./public",
	assetsDir: undefined,
	runtimeCompiler: undefined,
	productionSourceMap: false,
	parallel: undefined,
	css: undefined,

	pwa: {
		name: "KanTab"
	}
};
