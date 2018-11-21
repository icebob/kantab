[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)
[![Build Status](https://badgen.net/travis/icebob/kantab/master)](https://travis-ci.org/icebob/kantab)
[![Coverage Status](https://badgen.net/coveralls/c/github/icebob/kantab/master)](https://coveralls.io/github/icebob/kantab?branch=master)

# KanTab
KanTab is a kanban board application with microservices. Powered by Moleculer &amp; Vue.

![Screenshot](https://user-images.githubusercontent.com/306521/47039154-865d9100-d183-11e8-85c9-4cfc571ac8a5.png)

## Demo
Live demo on now.sh: https://kantab.now.sh/

## Tech stack
Desired features & modules:

- [x] Node v8.x with async/await
- [x] Moleculer microservices backend
- [x] VueJS frontend (VueX, Vue-router)
- [x] MongoDB
- [x] Central configuration
- [x] Global REST API
- [x] Swagger API docs
- [x] GraphQL endpoint
- [x] Full authentication
    - [x] Login
    - [x] Sign Up
    - [x] Passwordless account
    - [x] Forgot password
    - [x] Reset password    
    - [x] Account verification
    - [x] Social login
        - [x] Google
        - [x] Facebook
        - [x] Github
    - [x] Two-factor authentication
    - [ ] LDAP
- [x] ACL/RBAC (user roles & permissions)
- [x] I18N
- [ ] Websocket
- [ ] Plugin system
- [ ] Caching with tags
- [ ] Metrics & monitoring
- [x] Unit test & E2E test with Jest, Cypress
- [x] Docker files

## NPM Scripts

- `dev`: Start development mode (load all services locally)
- `start`: Start production mode (don't load any services, use `SERVICES` env variable)
- `now-start`: Start production preview on now.sh
- `cli`: Start a CLI and connect to production
- `build`: Build frontend code
- `lint`: Run ESLint
- `deps`: Check & update NPM dependencies
- `ci`: Run continuous backend test mode
- `ci:e2e`: Run continuous E2E test mode 
- `test`: Run all tests (backend, frontend, E2E)
- `test:backend`: Run backend tests
- `test:frontend`: Run frontend tests
- `test:e2e`: Run E2E tests
- `dc:up`: Start the stack with Docker Compose
- `dc:down`: Stop the stack with Docker Compose
