[![CircleCI](https://circleci.com/gh/Epsor/apollo-client-wrapper.svg?style=svg)](https://circleci.com/gh/Epsor/apollo-client-wrapper) [![npm version](https://img.shields.io/npm/v/@epsor/apollo-client-wrapper.svg)](https://npmjs.org/package/@epsor/apollo-client-wrapper.svg "View this project on npm")


# GraphQL API Client for all interfaces.

## Requirements

`ENVIRONMENT` must be defined as environment variable.
A `entryPoint` argument must be provided to the constructor in order to set the entry point of the GraphQL server.
If `entryPoint` is not defined, the `GRAPHQL_API_FQDN` environment variable will be set as the default entry point.
