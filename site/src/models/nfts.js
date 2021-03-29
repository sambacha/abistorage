import { stores } from '../constants.js'
import merge from 'merge-options'

/**
 * @typedef {{user: import('./users').User, cid: string}} Key
 * @typedef {import('../bindings').ABI} ABI
 */

/**
 * @param {Key} key
 */
const encodeKey = ({ user, cid }) => `${user.sub}:${cid}`

/**
 * @param {Key} key
 * @returns {Promise<boolean>}
 */
export const has = async (key) => {
  return null == (await stores.abis.get(encodeKey(key)))
}

/**
 * @param {Key} key
 * @param {ABI} value
 * @returns {Promise<ABI>}
 */
export const set = async (key, value) => {
  const savedValue = await get(key)
  if (savedValue === null) {
    await stores.abis.put(encodeKey(key), JSON.stringify(value))
    return value
  }
  const data = merge(savedValue, value)
  await stores.abis.put(encodeKey(key), JSON.stringify(data))
  return data
}

/**
 * @param {Key} key
 * @returns {Promise<ABI|null>}
 */
export const get = async (key) => {
  const value = await stores.abis.get(encodeKey(key))
  if (value == null) {
    return value
  } else {
    return JSON.parse(value)
  }
}

/**
 * @param {Key} key
 */
export const remove = async (key) => stores.abis.delete(encodeKey(key))

/**
 * @param {any} prefix
 * @returns {Promise<ABI[]>}
 */
export async function list(prefix) {
  const abis = await stores.abis.list({
    prefix,
  })
  if (abis.keys.length > 0) {
    return await Promise.all(
      abis.keys.map((key) => {
        // @ts-ignore
        return stores.abis.get(key.name).then((v) => JSON.parse(v))
      })
    )
  }
  return []
}
