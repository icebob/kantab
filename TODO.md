# TODO

## Common 
- [ ] load default values from ENV vars on config, e.g. "site.url" -> SITE_URL, "tokens.jwt.expires" -> TOKENS_JWT_EXPIRES
- [ ] change `speakeasy` to other lib
  - [ ] https://www.npmtrends.com/otpauth-vs-otplib-vs-speakeasy
  - [ ] https://github.com/yeojz/otplib
  - [ ] https://github.com/hectorm/otpauth

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
- [ ] Without login on public board, must hide the "Edit board" and Remove X button. 
  - [ ] IF you click on buttons, it doesn't show error toast.
  - [ ] If you open the board, it shows "+" add list buttons, but it's not enabled without login.
- [ ] If you open the page without login, it shows public boards, and after login boards are not refreshed.
- [ ] wrap the boards cards.

### Board page
- [ ] if you move a list, the order is not changed (labels switch back to the original labels)
