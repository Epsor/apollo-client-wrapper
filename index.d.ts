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
export const AUTHENTICATION_TOKEN_COOKIE: string;
export const COOKIE_DOMAIN: string;

export default initialize;
