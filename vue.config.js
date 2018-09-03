const path = require("path");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
module.exports = {
	chainWebpack: config => {
		//config.context(path.join(__dirname, "frontend"));

		if (process.argv.indexOf("--report") !== -1) {
			config.plugin("webpack-report").use(BundleAnalyzerPlugin, [{}]);
		}

		/*const copy = config.plugin("copy");
		copy.tap(args => {
			if (args.length > 0) {
				args[0].from = path.resolve("./frontend/public");
				console.log(args);
				return args;
			} else {
				copy.use(require("copy-webpack-plugin"), [[{
					from: path.resolve(__dirname, "./frontend/public"),
					to: path.resolve(__dirname, "./public"),
					ignore: []
				//ignore: publicCopyIgnore
				}]]);
			}
		});*/
		/*
		config
			.plugin("copy")
			.use(require("copy-webpack-plugin"), [[{
				from: path.resolve("./frontend/public"),
				to: path.resolve("./public"),
				//ignore: publicCopyIgnore
			}]]);
*/
		//.tap(args => console.log(args));
	},

	configureWebpack: config => {
		const folder = path.join(__dirname, "frontend");
		//config.context = folder;

		config.entry.app = [path.join(folder, "main.js")];
		config.resolve.alias["@"] = folder;

		//require("fs").writeFileSync("./webpack.generated.config.js", JSON.stringify(config, null, 4), "utf8");
		/*
		config.plugins.copy.args[0] = [{
			from: path.resolve(__dirname, "./frontend/public"),
			to: path.resolve(__dirname, "./public"),
			//ignore: publicCopyIgnore
		}];
		*/
	},

	// More info: https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-service/lib/options.js

	baseUrl: undefined,
	outputDir: "./static",
	assetsDir: undefined,
	productionSourceMap: false,

	pwa: {
		name: "KanTab"
	},

	lintOnSave: false
};
