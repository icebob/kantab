"use strict";

const MailService = require("moleculer-mail");

module.exports = {
	name: "mail",
	
	mixins: [MailService],

	/**
	 * Service dependencies
	 */
	dependencies: [
		{ name: "config", version: 1 }
	],

	/**
	 * Service settings
	 */
	settings: {
		from: "no-reply@kantab.moleculer.services",
		transport: {
			host: "smtp.mailtrap.io",
			port: 2525,
			auth: {
				user: process.env.MAILTRAP_USER,
				pass: process.env.MAILTRAP_PASS
			}			
		},
		templateFolder: "./templates/mail",

		// Common data
		data: {
			baseURL: "http://localhost:4000",
			siteName: "KanTab"
		}
	}
};