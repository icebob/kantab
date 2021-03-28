const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

module.exports = {
	name: "DockerComposeGenerator",

	started(broker) {
		const common = broker.metadata.dockerCompose;
		if (!common || !common.root) return;

		const res = _.cloneDeep(common.root);

		if (res.services == null) res.services = {};

		const svcBaseDir = common.serviceBaseDir
			? path.resolve(common.serviceBaseDir)
			: path.resolve(".", "services");

		broker.services.forEach(svc => {
			if (svc.metadata.dockerCompose === false) return;
			if (svc.metadata.dockerCompose == null && !common.serviceTemplate) return;
			if (svc.name.startsWith("$")) return;

			const schema = _.defaultsDeep(
				{},
				svc.metadata.dockerCompose ? svc.metadata.dockerCompose.template : null,
				common.serviceTemplate
			);
			if (schema.environment == null) schema.environment = {};

			if (schema.environment.SERVICES == null) {
				const relPath = path.relative(svcBaseDir, svc.__filename);
				schema.environment.SERVICES = relPath.replace(/\\/g, "/");
			}

			const serviceName =
				svc.metadata.dockerCompose && svc.metadata.dockerCompose.name
					? svc.metadata.dockerCompose.name
					: svc.fullName.replace(/[^\w\d]/g, "_");
			res.services[serviceName] = schema;
		});

		const content = yaml.dump(res);

		fs.writeFileSync(common.filename, content, "utf8");

		broker.logger.info(`Docker Compose file generated. Filename: ${common.filename}`);

		if (process.env.ONLY_GENERATE) {
			broker.logger.info(`Shutting down...`);
			broker.stop();
		}
	}
};
