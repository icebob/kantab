# TODO

## Common 
- [ ] load default values from ENV vars on config, e.g. "site.url" -> SITE_URL, "tokens.jwt.expires" -> TOKENS_JWT_EXPIRES
- [ ] change `speakeasy` to other lib
  - [ ] https://www.npmtrends.com/otpauth-vs-otplib-vs-speakeasy
  - [ ] https://github.com/yeojz/otplib
  - [ ] https://github.com/hectorm/otpauth
- [ ] remove deleted boards, list, cards after 30 days
- [x] openapi UI not working
- [ ] configure cache dependencies better (if delete a card, it doesn't drop the boards cache)

## Accounts
- [ ] Configure permissions for accounts actions
- [ ] Don't publish enable/disable account actions
- [ ] Separate the entity graphql type to `Profile` and `User`. The `User` is a type what other users can see (only id, username, fullName, avatar). The owner and members returns that type. The `Profile` is the current user's type what contains all available informations.
- [ ] separate `enable2Fa` to `init2Fa` and `confirm2Fa`

## Boards
- [ ] Only the owner can make a board to public/private and remove

## Lists


## Cards
- [ ] Generate a unique number for the cards. (too expensive to get the max number, maybe if will be aggregate in `database` module)

## Login
- [ ] Password reset doesn't check 2FA and login after the new password without it.

## Websocket
- [ ] Token-based authorization via websocket, + generate an instanceID in the browser
- [ ] WS rooms:
  - [ ] userID - get all board-specific notifications
  - [ ] boardID - get the given board notifications only

## Deployment
- [ ] Update docker-compose file (Grafana, Prometheus)

## Others
- check https://github.com/lipp/login-with/tree/master/src/strategies
- LDAP auth: 
    - https://www.npmjs.com/package/passport-ldapauth
    - https://stackoverflow.com/questions/17795007/node-js-ldap-auth-user
- SSO auth:
    - https://github.com/abbr/NodeSSPI
    - https://github.com/einfallstoll/express-ntlm
    - https://stackoverflow.com/questions/12140589/ntlm-authentication-using-node-js
    - https://www.example-code.com/nodejs/http_authentication.asp


## Frontend
- [ ] Avatar component, if no user's avatar create one with initials and hashed bg color of name

## Lists

## Cards
- [ ] Multi-level view
  - [ ] Minimal: Only the title and tags without name
  - [ ] Basic: Title, tags, members
  - [ ] Detailed: Cover image, Title, tags, comments, dates, members, progress
  - [ ] Expanded: + Description
