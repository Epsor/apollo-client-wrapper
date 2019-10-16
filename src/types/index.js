export const AUTHENTIFICATION_TOKEN_COOKIE = `${
  process.env.REACT_APP_ENVIRONMENT && process.env.REACT_APP_ENVIRONMENT === 'production'
    ? ''
    : `${process.env.REACT_APP_ENVIRONMENT}_`
}access_token_v2`;
