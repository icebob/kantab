"use strict";

const cron = require("cron");

/**
 *  Mixin service for Cron
 * Credits: https://github.com/davidroman0O/moleculer-cron
 *
 * @name moleculer-cron
 * @module Service
 */
module.exports = {
	name: "cron",

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Find a job by name
		 *
		 * @param {String} name
		 * @returns {CronJob}
		 */
		getJob(name) {
			return this.$crons.find(job => job.name == name);
		},

		//	stolen on StackOverflow
		makeid(size) {
			let text = "";
			let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			for (let i = 0; i < size; i++)
				text += possible.charAt(Math.floor(Math.random() * possible.length));

			return text;
		},

		/**
		 * Get a Cron time
		 * @param {String} time
		 */
		getCronTime(time) {
			return new cron.CronTime(time);
		}
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {
		this.$crons = [];

		if (this.schema.crons) {
			this.$crons = this.schema.crons.map(_job => {
				const job = Object.assign({}, _job);
				if (!job.name) job.name = this.makeid(20);

				//	Prevent error on runOnInit that handle onTick at the end of the constructor
				const runOnInit = job.runOnInit;
				job.runOnInit = undefined;

				if (typeof job.onTick == "object") {
					const def = job.onTick;
					job.onTick = async () => {
						const startTime = Date.now();
						this.logger.info(`Job '${job.name}' has been started.`);
						try {
							if (def.action) {
								await this.broker.call(def.action, def.params, def.opts);
							}
							if (def.event) {
								if (def.broadcast == true)
									await this.broker.broadcast(def.event, def.payload, def.opts);
								else await this.broker.emit(def.event, def.payload, def.opts);
							}
							this.logger.info(
								`Job '${job.name}' has been stopped. Time: ${
									Date.now() - startTime
								} ms`
							);
						} catch (err) {
							this.logger.error(
								`Job '${job.name}' execution failed. Time: ${
									Date.now() - startTime
								} ms`
							);
							this.logger.error(err);
						}
					};
				}

				const instance_job = new cron.CronJob(job);

				instance_job.runOnStarted = runOnInit;
				instance_job.manualStart = job.manualStart || false;
				instance_job.name = job.name;

				return instance_job;
			});
		}
	},

	/**
	 * Service started lifecycle event handler
	 */
	started() {
		this.$crons.map(job => {
			this.logger.debug(`Start '${job.name}' cron job.`);
			if (!job.manualStart) {
				job.start();
			}
			if (job.runOnStarted) {
				job.runOnStarted();
			}
		});
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	stopped() {
		this.$crons.map(job => {
			this.logger.debug(`Start '${job.name}' cron job.`);
			job.stop();
		});
	}
};
