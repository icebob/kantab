"use strict";

const MailService = require("moleculer-mail");
const ConfigLoader = require("../mixins/config.mixin");

const MAILDEV_TRANSPORT = {
	host: "localhost",
	port: 1025,
	ignoreTLS: true
};

const MAILTRAP_TRANSPORT = {
	host: "smtp.mailtrap.io",
	port: 2525,
	auth: {
		user: process.env.MAILTRAP_USER,
		pass: process.env.MAILTRAP_PASS
	}
};

module.exports = {
	name: "mail",
	version: 1,

	mixins: [MailService, ConfigLoader(["site.**", "mail.**"])],

	/**
	 * Service dependencies
	 */
	dependencies: [{ name: "config", version: 1 }],

	/**
	 * Service settings
	 */
	settings: {
		from: "no-reply@kantab.moleculer.services",
		transport:
			process.env.TEST_E2E || process.env.TEST_INT ? MAILDEV_TRANSPORT : MAILTRAP_TRANSPORT,
		templateFolder: "./backend/templates/mail"
	}
};
