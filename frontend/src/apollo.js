import { ApolloClient } from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { setContext } from "apollo-link-context";
import * as Cookie from "js-cookie";

const COOKIE_TOKEN_NAME = "jwt-token";
// HTTP connection to the API
const httpLink = createHttpLink({
	uri: "http://localhost:4000/graphql"
});

// Cache implementation
const cache = new InMemoryCache();

const authLink = setContext((_, { headers }) => {
	const token = Cookie.get(COOKIE_TOKEN_NAME);

	return {
		headers: {
			...headers,
			authorization: token ? `Bearer ${token}` : null
		}
	};
});
export async function apolloAuth() {
	try {
		await apolloClient.resetStore();
	} catch (e) {
		console.log("%cError on cache reset (login)", "color: orange;", e.message);
	}
}

export const apolloClient = new ApolloClient({
	link: authLink.concat(httpLink),
	cache
});
