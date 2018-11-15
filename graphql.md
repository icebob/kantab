## GraphQL gateway example

```js
module.exports = {
    name: "boards",
    settings: {},

    graphql: {
        // Define Graphql Query
        query: `
            boards(limit: Int, offset: Int, sort: String): [Board]
            board(id: String!): Board
        `,

        // Define new Types
        type: `
            type Board {
                id: String!,
                title: String!,
                slug: String,
                description: String,
                owner: User,
                createdAt: Float
            }
        `,
        // Define GraphQL Mutation
        mutation: `
            createBoard(title: String!, description: String): Board
        `,

        // Define resolvers
        resolvers: {
            Query: {
                boards: {
                    // Call the local "find" action with params
                    action: "find",
                    params: {
                        populate: ["owner"]
                    }
                },

                board: {
                    // Call the local "get" action with params
                    action: "get",
                    params: {
                        populate: ["owner"]
                    }
                }
            },
            Mutation: {
                // Call the local "create" action
                createBoard: "create"
            }
        },
    },

    actions: {
        //...
    }	
}
```

```js
module.exports = {
    name: "accounts",
    settings: {},

    graphql: {
        // Define new Type
        type: `
            type User {
                id: String!
                username: String!
                firstName: String!
                lastName: String!
                email: String
                avatar: String
                status: Int

                boards(limit: Int, offset: Int, sort: String): [Board]
                boardCount: Int
            }
        `,

        // Define resolvers
        resolvers: {
            User: {
                boards: {
                    // Call a remote "v1.boards.find" action
                    action: "v1.boards.find",
                    // Get `id` value from `root` and put it into `ctx.params.query.owner`
                    rootParams: {
                        "id": "query.owner"
                    },
                    params: {
                        populate: ["owner"]
                    }
                },
                boardCount: {
                    // Call a remote "v1.boards.count" action
                    action: "v1.boards.count",
                    // Get `id` value from `root` and put it into `ctx.params.query.owner`
                    rootParams: {
                        "id": "query.owner"
                    }
                }
            }
        }
    },

    actions: {
        find: {
            graphql: {
                // Create a GraphQL Query for this action
                query: "users(limit: Int, offset: Int, sort: String): [User]"
            },
            handler(ctx) {
                // ...
            }
        },

        create: {
            graphql: {
                // Create a GraphQL Mutation for this action
                mutation: "createUser(email: String!, password: String!): [User]"
            },
            handler(ctx) {
                // ...
            }
        }
    }	
}
```