import { apolloClient } from "../apollo";
import gql from "graphql-tag";

export const getBoardsApollo = async () => {
	const res = await apolloClient.query({
		query: gql`
			query {
				boards {
					id
					title
					description
					owner {
						username
						fullName
						boards {
							title
						}
					}
				}
			}
		`
	});
	return res.data.boards;
};
