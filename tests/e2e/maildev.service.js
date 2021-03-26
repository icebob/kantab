const MailDev = require("maildev");

module.exports = {
	name: "maildev",

	settings: {
		rest: true
	},

	actions: {
		getTokenFromMessage: {
			rest: "/getTokenFromMessage",
			// call maildev.getTokenFromMessage --recipients demo9@moleculer.services --pattern "passwordless\?token=(\w+)"
			// call maildev.getTokenFromMessage --recipients demo9@moleculer.services --pattern "verify-account\?token=(\w+)"
			// call maildev.getTokenFromMessage --recipients demo9@moleculer.services --pattern "reset-password\?token=(\w+)"
			params: {
				recipient: "string",
				subject: "string|optional",
				pattern: "string"
			},
			async handler(ctx) {
				let emails = await ctx.call("maildev.getAllEmail");

				// Filter by recipient
				emails = emails.filter(email => {
					return email.to.some(to => to.address == ctx.params.recipient);
				});

				// Filter by subject
				if (ctx.params.subject) {
					emails = emails.filter(email => email.subject == ctx.params.subject);
				}

				if (emails.length == 0) return null;

				// Sort by time descendant
				emails.sort((a, b) => b.time - a.time);

				const content = emails[0].html;

				const re = new RegExp(ctx.params.pattern, "g");

				const match = re.exec(content);
				return match && match.length > 1 ? match[1] : null;
			}
		},

		getAllEmail: {
			rest: "GET /getAllEmail",
			params: {
				recipient: "string|optional",
				subject: "string|optional"
			},
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.maildev.getAllEmail((err, store) => {
						if (err) reject(err);
						else resolve(store);
					});
				}).then(emails => {
					// Filter by recipient
					if (ctx.params.recipient) {
						emails = emails.filter(email => {
							return email.to.some(to => to.address == ctx.params.recipient);
						});
					}

					// Filter by subject
					if (ctx.params.subject) {
						emails = emails.filter(email => email.subject == ctx.params.subject);
					}
					return emails;
				});
			}
		},

		deleteAllEmail: {
			rest: "POST /deleteAllEmail",
			handler(ctx) {
				return new Promise((resolve, reject) => {
					this.maildev.deleteAllEmail(err => {
						if (err) reject(err);
						else resolve();
					});
				});
			}
		}
	},

	created() {
		this.maildev = new MailDev({
			smtp: 1025, // incoming SMTP port - default is 1025
			disableWeb: true
			//mailDirectory: "./mails"
		});
	},

	async started() {
		await new Promise((resolve, reject) => {
			this.maildev.listen(err => {
				if (err) reject(err);
				else resolve();
			});
		});

		this.maildev.on("new", email => {
			this.logger.info("Received new email with subject: %s", email.subject);
		});
	},

	stopped() {
		return new Promise((resolve, reject) => {
			this.maildev.close(err => {
				if (err) reject(err);
				else resolve();
			});
		});
	}
};
