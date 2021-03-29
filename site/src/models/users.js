import { signJWT } from '../utils/jwt.js'
import merge from 'merge-options'

const users = USERS
// TODO
// Refactor User into more Abstract 'Deployer'

/**
 * @typedef {{
 *   tokens: Record<string,string>
 *   sub: string
 *   nickname?: string
 *   name?: string
 *   email?: string
 *   picture?: string
 * }} User
 *
 * @expample
 * ```json
 * {
 *   "nickname":"SButerin",
 *   "name":"satoshi buterin",
 *   "picture":"https://....",
 *   "updated_at":"2021-03-09T20:47:39.307Z",
 *   "email":"usr@gmail.com",
 *   "email_verified":true,"iss":"https://*.auth0.com/",
 *   "sub":"github|[0-9]",
 *   "aud":"",
 *   "iat":1615322859,
 *   "exp":1615358859
 * }
 * ```
 */

// https://tools.ietf.org/html/rfc7519#section-4.1
/**
 * @param {Partial<User> & { sub: string } } newUser
 */
export async function createOrUpdate(newUser) {
  const partialData = {
    sub: newUser.sub,
    nickname: newUser.nickname,
    name: newUser.name,
    email: newUser.email,
    picture: newUser.picture,
  }

  const user = await users.get(newUser.sub)
  if (user === null) {
    const token = await signJWT({
      sub: newUser.sub,
      iss: 'abi-storage',
      iat: Date.now(),
      name: 'default',
    })
    const data = {
      ...partialData,
      tokens: { default: token },
    }
    return await users.put(newUser.sub, JSON.stringify(data))
  }

  const data = merge(JSON.parse(user), partialData)
  return await users.put(newUser.sub, JSON.stringify(data))
}

/**
 * @param {string} sub
 * @returns {Promise<User>}
 */
export async function getUser(sub) {
  const user = await users.get(sub)
  if (user === null) {
    throw new Error('user not found')
  }
  return JSON.parse(user)
}

/**
 * Match a token and returns the token name
 * @param {User} user
 * @param {string} token
 */
export function matchToken(user, token) {
  for (const key in user.tokens) {
    const value = user.tokens[key]
    if (token === value) {
      return key
    }
  }

  return false
}

/**
 * List user tokens
 *
 * @param {string} sub
 * @returns {Promise<User>}
 */
export async function tokens(sub) {
  const user = await users.get(sub)
  if (user === null) {
    throw new Error('user not found')
  }
  return JSON.parse(user).tokens
}

/**
 * Create new token
 *
 * @param {string} sub
 * @param {string} name
 */
export async function createToken(sub, name) {
  const user = await getUser(sub)
  const token = user.tokens[name]

  if (token) {
    throw new Error(`A token with name "${name}" already exists.`)
  }
  user.tokens[name] = await signJWT({
    sub: sub,
    iss: 'abi-storage',
    iat: Date.now(),
    name: name,
  })
  return await users.put(sub, JSON.stringify(user))
}

/**
 * Delete new token
 *
 * @param {string} sub
 * @param {string} name
 */
export async function deleteToken(sub, name) {
  const user = await getUser(sub)
  const token = user.tokens[name]

  if (token) {
    delete user.tokens[name]
  }
  return await users.put(sub, JSON.stringify(user))
}
