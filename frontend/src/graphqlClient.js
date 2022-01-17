import { GraphQLClient } from "graphql-request";
import Cookie from "js-cookie";

const COOKIE_TOKEN_NAME = "jwt-token";
const endpoint = "/graphql";
//const client = new GraphQLClient(endpoint);

// Set a single header
const token = Cookie.get(COOKIE_TOKEN_NAME);

//const client = new GraphQLClient(endpoint);

export const graphqlClient = new GraphQLClient(endpoint);
graphqlClient.setHeader("authorization", token ? `Bearer ${token}` : null);

// Override all existing headers
graphqlClient.setHeaders({
	authorization: token ? `Bearer ${token}` : null,
	anotherheader: "header_value"
});
