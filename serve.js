"use strict";

const webpackConfig = require("@vue/cli-service/webpack.config.js");

// Create express app
const express = require("express");
const app = express();

// Configure webpack as middleware
const webpack = require("webpack");

webpackConfig.entry.app.unshift("webpack-hot-middleware/client");
require("fs").writeFileSync("./webpack.generated.config.js", JSON.stringify(webpackConfig, null, 4), "utf8");
//return;

const compiler = webpack(webpackConfig);
const devMiddleware = require('webpack-dev-middleware'); // eslint-disable-line
app.use(devMiddleware(compiler, {
	noInfo: false,
	publicPath: webpackConfig.output.publicPath,
	headers: { "Access-Control-Allow-Origin": "*" },
	stats: {colors: true}
}));

const hotMiddleware = require('webpack-hot-middleware'); // eslint-disable-line
app.use(hotMiddleware(compiler, {
	log: console.log
}));

const port = 8080;
app.listen(port, function() {
	console.log("Developer server running on http://localhost:" + port);
});
