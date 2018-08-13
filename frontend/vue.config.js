const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
module.exports = {
	chainWebpack: config => {
		if (process.argv.indexOf("--report") !== -1) {
			config.plugin("webpack-report").use(BundleAnalyzerPlugin, [{}]);
		}
	},

	baseUrl: undefined,
	outputDir: "../public",
	assetsDir: undefined,
	runtimeCompiler: undefined,
	productionSourceMap: undefined,
	parallel: undefined,
	css: undefined
};
