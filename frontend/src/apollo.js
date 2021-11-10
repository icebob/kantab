import { ApolloClient } from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { setContext } from "apollo-link-context";
import * as Cookie from "js-cookie";

// HTTP connection to the API
const httpLink = createHttpLink({
	// You should use an absolute URL here
	uri: "http://localhost:4000/graphql"
});

// Cache implementation
const cache = new InMemoryCache();

// Create the apollo client

const authLink = setContext((_, { headers }) => {
	// get the authentication token from token if it exists
	//const token = ApplicationSettings.getString("token");
	const token = Cookie.get("jwt-token");

	// return the headers to the context so HTTP link can read them
	return {
		headers: {
			...headers,
			authorization: token ? `Bearer ${token}` : null
		}
	};
});

export const apolloClient = new ApolloClient({
	link: authLink.concat(httpLink),
	cache: new InMemoryCache() // If you want to use then
});
