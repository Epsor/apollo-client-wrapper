export const AUTHENTICATION_TOKEN_COOKIE = `${
  process.env.REACT_APP_ENVIRONMENT && process.env.REACT_APP_ENVIRONMENT === 'production'
    ? ''
    : `${process.env.REACT_APP_ENVIRONMENT}_`
}access_token_v2`;

export const COOKIE_DOMAIN = `${
  process.env.REACT_APP_ENVIRONMENT && process.env.REACT_APP_ENVIRONMENT === 'production'
    ? ''
    : `.${process.env.REACT_APP_ENVIRONMENT}`
}.epsor.fr`;

export default {
  AUTHENTICATION_TOKEN_COOKIE,
  COOKIE_DOMAIN,
};
