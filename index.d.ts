import { ApolloClient } from 'apollo-client';

declare function initialize(options: {
  defaultState: {
    getErrors: [];
  };
  resolvers: object;
  httpEntryPoint?: string;
  wsEntryPoint?: string;
  fallbackUrl?: string;
  authUrl?: string;
}): ApolloClient<{}>;

export function createUuid(): string;

export default initialize;
