import { HTTPError } from '../errors.js'
import { verifyToken } from '../utils/utils.js'
import { get as getNft } from '../models/abis.js'
import { JSONResponse } from '../utils/json-response.js'
import { get as getABIs } from '../models/abis.js'

/**
 * @typedef {import('../bindings').ABI} ABI
 */

/**
 * @param {FetchEvent} event
 * @param {Record<string,string>} params
 */
export const status = async (event, params) => {
  const token = await verifyToken(event)
  if (!token.ok) {
    return HTTPError.respond(token.error)
  }
  const user = token.user

  const [abi, abis] = await Promise.all([
    getNft({ user, cid: params.cid }),
    getABIs(params.cid),
  ])

  if (abi == null) {
    return HTTPError.respond(new HTTPError('not found', 404))
  }

  return new JSONResponse({
    ok: true,
    value: {
      ...abi,
      abis: { status: getOverallABIStatus(abis), abis },
    },
  })
}

/**
 * @param {ABI[]} abis
 * @returns {'ongoing'|'finalized'}
 */
function getOverallABIStatus(abis) {
  if (!abis.length) return 'ongoing'
  return abis.some((d) => d.status !== 'active') ? 'ongoing' : 'finalized'
}
