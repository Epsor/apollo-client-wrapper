import uuidv4 from 'uuid/v4';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { onError } from 'apollo-link-error';
import { withClientState } from 'apollo-link-state';
import { ApolloLink, split } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import Cookies from 'js-cookie';
import fetch from 'unfetch';
import merge from 'lodash/merge';

import { AUTHENTIFICATION_TOKEN_COOKIE } from './types';

export const createUuid = uuidv4;

/**
 * Initialize Apollo client
 * @param {string} entryPoint GraphQL server entry point
 */
export default (
  { defaultState, resolvers, defaultOptions },
  entryPoint = process.env.REACT_APP_GRAPHQL_API_FQDN,
) => {
  /**
   * Define cache system.
   */
  const cache = new InMemoryCache({
    dataIdFromObject: ({ __typename, uuid }) =>
      __typename && uuid ? `${__typename}:${uuid}` : null,
  });

  /**
   * Set token from cookies in every header request.
   */
  const setAuthorizationLink = setContext((_, { headers }) => {
    const token = Cookies.get(AUTHENTIFICATION_TOKEN_COOKIE);
    return {
      headers: { ...headers, Authorization: token ? `Bearer ${token}` : '' },
    };
  });

  const stateLink = withClientState({
    cache,
    defaults: defaultState,
    resolvers,
  });

  const websocketLink = new WebSocketLink(
    new SubscriptionClient(
      `ws${process.env.NODE_ENV === 'development' ? '' : 's'}://${entryPoint}/graphql`,
      {
        reconnect: true,
      },
    ),
  );

  const httpLink = new HttpLink({
    uri: `http${process.env.NODE_ENV === 'development' ? '' : 's'}://${entryPoint}`,
    credentials: 'include',
    fetch,
  });

  const link = split(
    // split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    websocketLink,
    httpLink,
  );

  /**
   * Apollo Client:
   *  - Error Middleware
   *  - Authorization header middleware to add jwt to each request
   *  - Cache middleware
   *  - Websocket middleware for subscription
   *  - HTTP middleware to define graphql endpoint.
   */
  return new ApolloClient({
    link: ApolloLink.from([
      onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors) {
          // @todo: How do we display errors ?
        }
        if (networkError) {
          // @todo: Logout user ?
        }
      }),
      setAuthorizationLink,
      stateLink,
      link,
    ]),
    resolvers: {
      Mutation: {},
    },
    defaultOptions: merge(
      {
        mutate: {
          errorPolicy: 'all',
        },
        query: {
          errorPolicy: 'all',
        },
        watchQuery: {
          errorPolicy: 'all',
        },
      },
      defaultOptions || {},
    ),
    cache,
    connectToDevTools: process.env.NODE_ENV === 'development',
  });
};
