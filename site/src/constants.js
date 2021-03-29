// let AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, SALT, PINATA_JWT
export const stores = {
  auth: SESSION,
  csrf: CSRF,
  abis: DEALS,
  users: USERS,
  abis: ABIS,
}

export const auth0 = {
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
  callbackUrl: AUTH0_CALLBACK_URL,
  salt: SALT,
}

export const pinata = {
  jwt: PINATA_JWT,
}

export const cookieKey = 'AUTH0-AUTH'

export const isDebug = DEBUG === 'true'
