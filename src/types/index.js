export const AUTHENTICATION_TOKEN_COOKIE =
  process.env.REACT_APP_ENVIRONMENT && process.env.REACT_APP_ENVIRONMENT === 'production'
    ? 'access_token_v2'
    : `${process.env.REACT_APP_ENVIRONMENT}_access_token_v2`;

export const USERCOMPANY_COOKIE =
  process.env.REACT_APP_ENVIRONMENT && process.env.REACT_APP_ENVIRONMENT === 'production'
    ? 'user_company_uuid'
    : `${process.env.REACT_APP_ENVIRONMENT}_user_company_uuid`;

export const COOKIE_DOMAIN =
  process.env.REACT_APP_ENVIRONMENT && process.env.REACT_APP_ENVIRONMENT === 'production'
    ? '.epsor.fr'
    : `.${process.env.REACT_APP_ENVIRONMENT}.epsor.fr`;

export default {
  AUTHENTICATION_TOKEN_COOKIE,
  USERCOMPANY_COOKIE,
  COOKIE_DOMAIN,
};
