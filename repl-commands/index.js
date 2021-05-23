const glob = require("glob").sync;

const folder = "./repl-commands";
module.exports = glob("*.js", { cwd: folder, absolute: true })
	.filter(filename => !filename.includes("index.js"))
	.map(filename => require(filename));
