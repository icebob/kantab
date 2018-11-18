"use strict";

const { ApolloServerBase } = require("apollo-server-core");
const { processRequest } = require("@apollographql/apollo-upload-server");
const { renderPlaygroundPage } = require("@apollographql/graphql-playground-html");
const accept = require("accept");
const moleculerApollo = require("./moleculerApollo");

function send(res, statusCode, data, responseType = "application/json") {
	res.statusCode = statusCode;

	const ctx = res.$ctx;
	if (!ctx.meta.$responseType)
		ctx.meta.$responseType = responseType;

	const service = res.$service;
	service.sendResponse(res.$ctx, res.$route, null, res, data);
}

class ApolloServer extends ApolloServerBase {

	// Extract Apollo Server options from the request.
	createGraphQLServerOptions(req, res) {
		return super.graphQLServerOptions({ req, res });
	}

	// Prepares and returns an async function that can be used by Micro to handle
	// GraphQL requests.
	createHandler({ path, disableHealthCheck, onHealthCheck, } = {}) {
		const promiseWillStart = this.willStart();
		return async (req, res) => {
			this.graphqlPath = path || "/graphql";

			await promiseWillStart;

			if (this.uploadsConfig)
				await this.handleFileUploads(req);

			let handled = false;

			if (!handled)
				handled = await this.handleHealthCheck({ req, res, disableHealthCheck, onHealthCheck });

			if (!handled)
				handled = this.handleGraphqlRequestsWithPlayground({ req, res });

			if (!handled)
				handled = await this.handleGraphqlRequestsWithServer({ req, res });

			if (!handled)
				send(res, 404, "Not found", "text/plain");
		};
	}

	// This integration supports file uploads.
	supportsUploads() {
		return true;
	}

	// This integration supports subscriptions.
	supportsSubscriptions() {
		return true;
	}

	// If health checking is enabled, trigger the `onHealthCheck`
	// function when the health check URL is requested.
	async handleHealthCheck({ req, res, disableHealthCheck, onHealthCheck, }) {
		let handled = false;
		if (!disableHealthCheck && req.url === "/.well-known/apollo/server-health") {
			res.setHeader("Content-Type", "application/health+json");
			if (onHealthCheck) {
				try {
					await onHealthCheck(req);
				}
				catch (error) {
					send(res, 503, { status: "fail" });
					handled = true;
				}
			}
			if (!handled) {
				send(res, 200, { status: "pass" });
				handled = true;
			}
		}
		return handled;
	}

	// If the `playgroundOptions` are set, register a `graphql-playground` instance
	// (not available in production) that is then used to handle all
	// incoming GraphQL requests.
	handleGraphqlRequestsWithPlayground({ req, res, }) {
		let handled = false;
		if (this.playgroundOptions && req.method === "GET") {
			const { mediaTypes } = accept.parseAll(req.headers);
			const prefersHTML = mediaTypes.find((x) => x === "text/html" || x === "application/json") === "text/html";

			if (prefersHTML) {
				const middlewareOptions = Object.assign({ endpoint: this.graphqlPath, subscriptionEndpoint: this.subscriptionsPath }, this.playgroundOptions);
				send(res, 200, renderPlaygroundPage(middlewareOptions), "text/html");
				handled = true;
			}
		}
		return handled;
	}

	// Handle incoming GraphQL requests using Apollo Server.
	async handleGraphqlRequestsWithServer({ req, res, }) {
		let handled = false;
		const url = req.originalUrl.split("?")[0];
		if (url === this.graphqlPath) {
			const graphqlHandler = moleculerApollo(() => this.createGraphQLServerOptions(req, res));
			const responseData = await graphqlHandler(req, res);
			send(res, 200, responseData);
			handled = true;
		}
		return handled;
	}

	// If file uploads are detected, prepare them for easier handling with
	// the help of `apollo-upload-server`.
	async handleFileUploads(req) {
		const contentType = req.headers["content-type"];
		if (contentType && contentType.startsWith("multipart/form-data")) {
			req.filePayload = await processRequest(req, this.uploadsConfig);
		}
	}
}
exports.ApolloServer = ApolloServer;
