import { stores } from '../constants.js'

/**
 * @typedef {import('../bindings').ABI} ABI
 */

/**
 * @param {string} cid CID of the ABI data
 * @returns {Promise<ABI[]>}
 */
export const get = async (cid) => {
  const data = await stores.abis.get(cid)
  return data == null ? [] : JSON.parse(data)
}
