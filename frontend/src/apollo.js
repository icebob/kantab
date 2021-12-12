import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client/core";
import { setContext } from "apollo-link-context";
import { createApolloProvider } from "@vue/apollo-option";

import Cookie from "js-cookie";

const COOKIE_TOKEN_NAME = "jwt-token";
// HTTP connection to the API
const httpLink = createHttpLink({
	uri: "/graphql"
});

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
		console.error("Error on cache reset (login)", e.message);
	}
}

export const apolloClient = new ApolloClient({
	link: authLink.concat(httpLink),
	cache: new InMemoryCache({
		addTypename: false,
		freezeResults: false,
		resultCaching: false
	}),
	assumeImmutableResults: false
});

export const apolloProvider = createApolloProvider({
	defaultClient: apolloClient
});
