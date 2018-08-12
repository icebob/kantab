"use strict";


function loadSecureModule(name, logger = console) {
	try {
		return require(name);
	}
	catch (error) {
		logger.error(`The '${name}' package is missing. Please install it with 'npm install ${name}' command.`);
		return;
	}
}

module.exports = {
	loadSecureModule
};