module.exports = {
	outputDir: "../public",
	filenameHashing: true,
	productionSourceMap: false,

	devServer: {
		https: false,
		port: 8080,
		proxy: "http://localhost:4000",
		open: false // opens browser window automatically
	}
};
