import { ApolloClient } from 'apollo-client';
import { v4 } from 'uuid/interfaces';

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

export const createUuid: v4;

export default initialize;
