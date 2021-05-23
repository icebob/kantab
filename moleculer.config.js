"use strict";

const _ = require("lodash");
const { inspect } = require("util");
require("@moleculer/lab");

const isProd = process.env.NODE_ENV == "production";

// More info about options: https://moleculer.services/docs/0.13/broker.html#Broker-options
module.exports = {
	namespace: "",
	nodeID: null,

	logger:
		process.env.TEST_E2E == "run"
			? false
			: [
					{
						type: "Console",
						options: {
							formatter: "short",
							moduleColors: true,
							//autoPadding: true
							objectPrinter: o =>
								inspect(o, { depth: 4, colors: true, breakLength: 100 })
						}
					},
					{
						type: "File",
						options: {
							folder: "./logs",
							formatter: "full"
						}
					},
					"Laboratory"
			  ],
	logLevel: "info",

	serializer: "JSON",

	//requestTimeout: 10 * 1000,
	retryPolicy: {
		enabled: false,
		retries: 5,
		delay: 100,
		maxDelay: 1000,
		factor: 2,
		check: err => err && !!err.retryable
	},

	maxCallLevel: 100,
	heartbeatInterval: 5,
	heartbeatTimeout: 15,

	tracking: {
		enabled: false,
		shutdownTimeout: 5000
	},

	disableBalancer: false,

	registry: {
		strategy: "RoundRobin",
		preferLocal: true
	},

	circuitBreaker: {
		enabled: false,
		threshold: 0.5,
		windowTime: 60,
		minRequestCount: 20,
		halfOpenTime: 10 * 1000,
		check: err => err && err.code >= 500
	},

	bulkhead: {
		enabled: false,
		concurrency: 10,
		maxQueueSize: 100
	},

	// Enable action & event parameter validation. More info: https://moleculer.services/docs/0.14/validating.html
	validator: true,

	// Enable/disable built-in metrics function. More info: https://moleculer.services/docs/0.14/metrics.html
	metrics: {
		enabled: true,
		reporter: [
			"Laboratory",
			isProd
				? {
						// Available built-in reporters: "Console", "CSV", "Event", "Prometheus", "Datadog", "StatsD"
						type: "Prometheus",
						options: {
							// HTTP port
							port: 3030,
							// HTTP URL path
							path: "/metrics",
							// Default labels which are appended to all metrics labels
							defaultLabels: registry => ({
								namespace: registry.broker.namespace,
								nodeID: registry.broker.nodeID
							})
						}
				  }
				: null
		]
	},

	tracing: {
		enabled: true,
		events: true,
		exporter: [
			//"Laboratory"
			!isProd && !process.env.TEST_E2E
				? {
						type: "Console",
						options: {
							width: 100,
							colors: true,
							logger: console.log
						}
				  }
				: null
		]
	},

	internalServices: true,
	internalMiddlewares: true,

	// Register custom middlewares
	middlewares: [
		require("./backend/middlewares/async-context.middleware"),
		require("./backend/middlewares/check-permissions.middleware"),
		require("./backend/middlewares/find-entity.middleware"),
		require("./backend/middlewares/docker-compose-generator.middleware"),
		require("./backend/middlewares/prometheus-file-generator.middleware")
	],

	// Called after broker created.
	created(broker) {},

	// Called after broker starte.
	started(broker) {
		if (process.env.TEST_E2E) {
			broker.loadService("./tests/e2e/maildev.service.js");
			require("./tests/e2e/bootstrap")(broker);
		}
	},

	// Called after broker stopped.
	stopped(broker) {},

	metadata: {
		dockerCompose: {
			filename: "./docker-compose.yml",
			serviceBaseDir: "backend/services",
			root: {
				version: "3.0",

				services: {
					nats: {
						image: "nats:2",
						ports: ["4222:4222"],
						restart: "unless-stopped",
						command: ["-m", "8222"]
					},

					nats_exporter: {
						image: "natsio/prometheus-nats-exporter:latest",
						command: ["-varz", "http://nats:8222"]
					},

					redis: {
						image: "redis:6-alpine",
						restart: "unless-stopped"
					},

					redis_exporter: {
						image: "oliver006/redis_exporter:alpine",
						environment: {
							REDIS_ADDR: "redis://redis:6379"
						}
					},

					mongo: {
						image: "mongo:4",
						volumes: ["mongo_data:/data/db"],
						restart: "unless-stopped"
					},

					mongo_exporter: {
						image: "bitnami/mongodb-exporter:latest",
						environment: {
							MONGODB_URI: "mongodb://mongo:27017"
						},
						command: ["--compatible-mode"]
					},

					traefik: {
						image: "traefik:2.4",
						command: [
							"--api.insecure=true", // Don't do that in production!
							"--entryPoints.http.address=:80",
							"--providers.docker=true",
							"--providers.docker.exposedbydefault=false",
							"--metrics.prometheus=true",
							"--entryPoints.metrics.address=:8082",
							"--metrics.prometheus.entryPoint=metrics"
						],
						ports: ["3000:80", "3001:8080"],
						volumes: ["/var/run/docker.sock:/var/run/docker.sock:ro"],
						restart: "unless-stopped"
					},

					prometheus: {
						image: "prom/prometheus:v2.25.0",
						volumes: [
							"./monitoring/prometheus/:/etc/prometheus/",
							"prometheus_data:/prometheus"
						],
						command: [
							"--config.file=/etc/prometheus/prometheus.yml",
							"--storage.tsdb.path=/prometheus",
							"--web.console.libraries=/usr/share/prometheus/console_libraries",
							"--web.console.templates=/usr/share/prometheus/consoles"
						],
						ports: ["9090:9090"],
						links: ["alertmanager:alertmanager"],
						restart: "unless-stopped"
					},

					alertmanager: {
						image: "prom/alertmanager:v0.15.3",
						ports: ["9093:9093"],
						volumes: ["./monitoring/alertmanager/:/etc/alertmanager/"],
						restart: "unless-stopped",
						command: [
							"--config.file=/etc/alertmanager/config.yml",
							"--storage.path=/alertmanager"
						]
					},

					grafana: {
						image: "grafana/grafana:6.5.0",
						depends_on: ["prometheus"],
						ports: ["9000:3000"],
						volumes: [
							"grafana_data:/var/lib/grafana",
							"./monitoring/grafana/provisioning/:/etc/grafana/provisioning/",
							"./monitoring/grafana/plugins/:/var/lib/grafana/plugins/"
						],
						environment: [
							"GF_SECURITY_ADMIN_PASSWORD=admin",
							"GF_USERS_ALLOW_SIGN_UP=false"
						],
						restart: "unless-stopped"
					}
				},

				volumes: {
					app_data: {
						driver: "local"
					},
					mongo_data: {
						driver: "local"
					},
					prometheus_data: {
						driver: "local"
					},
					grafana_data: {
						driver: "local"
					}
				}
			},

			serviceTemplate: {
				image: "kantab",
				env_file: "docker-compose.env",
				volumes: [
					"app_data:/app/data",
					"./monitoring/prometheus:/app/monitoring/prometheus"
				],
				// Prometheus metric port
				expose: [3030],
				depends_on: ["mongo", "nats", "redis"],
				restart: "unless-stopped"
			}
		}
	},

	replCommands: require("./repl-commands")
};
