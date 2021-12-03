# TODO

## Common 
- [ ] load default values from ENV vars on config, e.g. "site.url" -> SITE_URL, "tokens.jwt.expires" -> TOKENS_JWT_EXPIRES
- [ ] change `speakeasy` to other lib
  - [ ] https://www.npmtrends.com/otpauth-vs-otplib-vs-speakeasy
  - [ ] https://github.com/yeojz/otplib
  - [ ] https://github.com/hectorm/otpauth


## Boards
- [ ] Only the owner can make a board to public/private

## Lists
- [ ] Set default position value if null. Get the max position + 1


## Cards


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
