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
import MessageTypes from 'subscriptions-transport-ws/dist/message-types';
import Cookies from 'js-cookie';
import fetch from 'unfetch';
import merge from 'lodash/merge';

import { AUTHENTICATION_TOKEN_COOKIE, COOKIE_DOMAIN, USERCOMPANY_COOKIE } from './types';

export const createUuid = uuidv4;

/**
 * Initialize Apollo client.
 *
 * @param {string} entryPoint GraphQL server entry point
 */
export default ({
  resolvers,
  tokenPrefix,
  defaultOptions,
  redirectOnError = true,
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

  /**
   * Get the AccessToken from cookies.
   *
   * @returns {?string} Get the value of the token cookie
   */
  const getToken = () =>
    Cookies.get(`${tokenPrefix ? `${tokenPrefix}_` : ''}${AUTHENTICATION_TOKEN_COOKIE}`);

  /**
   * Get the UserCompanyUuid from cookies.
   *
   * @returns {?string} Get the value of the userCompany cookie
   */
  const getUserCompanyUuid = () => Cookies.get(USERCOMPANY_COOKIE);

  /**
   * Get header from cookies.
   *
   * @returns {object} Additional header to send to each requests
   */
  const getHeaders = () => {
    const token = getToken();
    const userCompanyUuid = getUserCompanyUuid();

    return {
      ...(userCompanyUuid ? { 'x-UserCompany': userCompanyUuid } : {}),
      Authorization: token ? `Bearer ${token}` : '',
    };
  };

  /**
   * Set token from cookies in every header request.
   */
  const setAuthorizationLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        ...getHeaders(),
      },
    };
  });

  const wsClient = new SubscriptionClient(wsEntryPoint, {
    reconnect: true,
    connectionParams: () => {
      const token = getToken();
      const userCompanyUuid = getUserCompanyUuid();

      return {
        headers: {
          // BE AWARE - lowercase header name
          authorization: token ? `Bearer ${token}` : '',
          ...(userCompanyUuid ? { 'x-UserCompany': userCompanyUuid } : {}),
        },
      };
    },
  });

  wsClient.maxConnectTimeGenerator.duration = () => wsClient.maxConnectTimeGenerator.max;

  const websocketLink = new WebSocketLink(wsClient);

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
  const client = new ApolloClient({
    link: ApolloLink.from([
      onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors) {
          graphQLErrors.forEach(error => {
            if (redirectOnError && error.extensions.code === 'UNAUTHENTICATED') {
              if (getToken()) {
                Cookies.remove(AUTHENTICATION_TOKEN_COOKIE, { domain: COOKIE_DOMAIN });
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

  /**
   * Allows to drop the connection and reconnect to previous subscriptions
   * Can be useful in the case of an authentication where the connectionParams
   * of the wsClient have changed, (e.g when the auth token is set)
   */
  client.resetWSConnection = () => {
    wsClient.close();
    wsClient.connect();

    Object.keys(wsClient.operations).forEach(id => {
      wsClient.sendMessage(id, MessageTypes.GQL_START, wsClient.operations[id].options);
    });
  };
  return client;
};
