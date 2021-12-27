# TODO

## Common 
- [ ] load default values from ENV vars on config, e.g. "site.url" -> SITE_URL, "tokens.jwt.expires" -> TOKENS_JWT_EXPIRES
- [ ] change `speakeasy` to other lib
  - [ ] https://www.npmtrends.com/otpauth-vs-otplib-vs-speakeasy
  - [ ] https://github.com/yeojz/otplib
  - [ ] https://github.com/hectorm/otpauth
- [ ] remove deleted boards, list, cards after 30 days
- [x] openapi UI not working


## Boards
- [ ] Only the owner can make a board to public/private

## Lists


## Cards
- [ ] Generate a unique number for the cards.

## Login
- [ ] Password reset doesn't check 2FA and login after the new password without it.

## Websocket
- [ ] Need authorization via websocket

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
- [ ] Avatar component, if you user's avatar create one with initials and hashed bg color of name

## Lists
- [ ] collapsible lists
- [ ] scrolling at moving

## Cards
- [ ] Multi-level view
  - [ ] Minimal: Only the title and tags without name
  - [ ] Basic: Title, tags, members
  - [ ] Detailed: Cover image, Title, tags, comments, dates, members, progress
  - [ ] Expanded: + Description
