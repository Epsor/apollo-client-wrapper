import uuidv4 from 'uuid/v4';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import { onError } from 'apollo-link-error';
import { ApolloLink, split } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { createUploadLink } from 'apollo-upload-client';
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
export default ({
  resolvers,
  defaultOptions,
  httpEntryPoint = process.env.REACT_APP_GRAPHQL_API_HTTP_URL,
  wsEntryPoint = process.env.REACT_APP_GRAPHQL_API_WS_URL,
  fallbackUrl = '/deconnexion',
  authUrl = process.env.REACT_APP_AUTH_INTERFACE_FQDN,
} = {}) => {
  /**
   * Define cache system.
   */
  const cache = new InMemoryCache({
    dataIdFromObject: ({ __typename, uuid }) =>
      __typename && uuid ? `${__typename}:${uuid}` : null,
  });

  const getToken = () => Cookies.get(AUTHENTIFICATION_TOKEN_COOKIE);
  /**
   * Set token from cookies in every header request.
   */
  const setAuthorizationLink = setContext((_, { headers }) => {
    const token = getToken();
    return {
      headers: { ...headers, Authorization: token ? `Bearer ${token}` : '' },
    };
  });

  const websocketLink = new WebSocketLink(
    new SubscriptionClient(wsEntryPoint, {
      reconnect: true,
      connectionParams: () => {
        const token = getToken();
        return {
          headers: {
            authorization: token ? `Bearer ${token}` : '',
          },
        };
      },
    }),
  );

  const httpLink = createUploadLink({
    uri: httpEntryPoint,
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
          graphQLErrors.forEach(error => {
            if (error.extensions.code === 'UNAUTHENTICATED') {
              if (getToken()) {
                Cookies.remove(AUTHENTIFICATION_TOKEN_COOKIE);
                window.location.replace(fallbackUrl);
                return;
              }
              window.location.assign(authUrl);
            }
          });
        }
        if (networkError) {
          // @todo: Logout user ?
        }
      }),
      setAuthorizationLink,
      link,
    ]),
    resolvers,
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
