[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)
[![Build Status](https://badgen.net/travis/icebob/kantab/master)](https://travis-ci.org/icebob/kantab)
[![Coverage Status](https://badgen.net/coveralls/c/github/icebob/kantab/master)](https://coveralls.io/github/icebob/kantab?branch=master)

# KanTab
KanTab is a kanban board application with microservices. Powered by Moleculer &amp; Vue.

![Screenshot](https://user-images.githubusercontent.com/306521/47039154-865d9100-d183-11e8-85c9-4cfc571ac8a5.png)

<!-- ## Demo
Live demo on now.sh: https://kantab.now.sh/ -->

## Tech stack
Desired features & modules:

- [x] Node v14.x with async/await
- [x] Moleculer microservices backend
- [x] VueJS frontend (VueX, Vue-router)
- [ ] TailwindCSS design
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
- [x] Websocket
- [ ] Plugin system
- [ ] Caching with tags
- [x] Metrics & monitoring
- [x] Unit test with Jest, Cypress
- [x] Unit test with Cypress
- [x] Docker files
- [ ] Docker Compose file generator middleware
- [ ] Prometheus file generator middleware
- [ ] Kubernetes & Helm chart files
- [ ] Kubernetes file generator middleware

## Monitoring
In production, this project contains monitoring feature with [Prometheus](https://prometheus.io/) & [Grafana](https://grafana.com/).

[Read more about it](monitoring/README.md)

## Usage

### Build frontend
The frontend Vue project is in the `frontend` folder. The build process generates the bundle files and copy them to the `public` folder which is served by the Moleculer API Gateway.

```bash
cd frontend
npm i
npm run build
```

### Start backend
To run the backend you need a running MongoDB server on localhost. Or set the remote MongoDB uri to the `MONGO_URI` environment variable.
```bash
npm run dev
```

The application is available on http://localhost:4000

### GraphQL Playground

The GraphQL playground is available on http://localhost/graphql

### OpenAPI (Swagger) UI

The OpenAPI UI is available on http://localhost/openapi

## NPM Scripts

- `dev`: Start development mode (load all services locally)
- `start`: Start production mode (don't load any services, use `SERVICES` env variable)
- `build:frontend`: Build frontend code
- `lint`: Run ESLint
- `lint:fix`: Run ESLint with fixes
- `deps`: Check & update NPM dependencies
- `ci`: Run continuous backend test mode
- `ci:e2e`: Run continuous E2E test mode 
- `test`: Run all tests (backend, frontend, E2E)
- `test:backend`: Run backend tests
- `test:e2e`: Run E2E tests
- `dc:up`: Start the stack in production with Docker Compose
- `dc:down`: Stop the stack in production with Docker Compose
