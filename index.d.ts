import { ApolloClient } from 'apollo-client';

interface Client<TCacheShape> extends ApolloClient<TCacheShape> {
  resetWSConnection(): void;
}

declare function initialize(options: {
  defaultState: {
    getErrors: [];
  };
  resolvers: object;
  httpEntryPoint?: string;
  wsEntryPoint?: string;
  fallbackUrl?: string;
  authUrl?: string;
}): Client<{}>;

export function createUuid(): string;

export default initialize;
