"use strict";

const chalk = require("chalk");

module.exports = broker => {

	broker.logger.info("Starting Cypress for End-to-End testing...");

	// Redirect Cypress logs to Moleculer logger
	const logger = broker.getLogger("CYPRESS");
	const stream = require("stream");
	const logStream = new stream.Stream();

	logStream.writable = true;
	logStream.write = data => logger.info(chalk.bgMagenta.bold.white("CYPRESS:"), data.toString("utf8").trim());

	// Execute Cypress
	const execa = require("execa");
	const runner = execa(require.resolve("cypress/bin/cypress"), ["open"]);
	runner.stdout.pipe(logStream);

	runner.on("exit", async () => await broker.stop());
	runner.on("error", async () => await broker.stop());
	runner.on("exit", code => process.exit(code));
};
