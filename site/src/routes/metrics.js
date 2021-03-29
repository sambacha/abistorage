import { stores } from '../constants.js'
import { get as getABIs } from '../models/abis.js'

const MAX_AGE_SECS = 600 // max age of a metrics response in seconds
const STALE_WHILE_REVALIDATE_SECS = 3600

/**
 * Note: add a cache busting suffix if you change the code and want to see a
 * change immediately after deploy.
 * @param {string} url 
 * @returns {string}
 */
function getCacheKey (url) {
  return `${new URL(url).origin}/metrics`
}

/**
 * TODO: basic auth
 * @param {FetchEvent} event
 */
export async function metrics(event) {
  const cache = caches.default
  const cacheKey = getCacheKey(event.request.url)

  let res = await cache.match(cacheKey)
  if (res) return res

  const [userMetrics, abiMetrics] = await Promise.all([getUserMetrics(), getNftMetrics()])
  res = new Response(exportPromMetrics({ userMetrics, abiMetrics }))
  // Cache the response for MAX_AGE_SECS
  res.headers.append('Cache-Control', `public,max-age=${MAX_AGE_SECS},stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECS}`)
  event.waitUntil(cache.put(cacheKey, res.clone()))
  return res
}

// TODO: keep running total?
async function getUserMetrics () {
  let total = 0
  let done = false
  let cursor
  while (!done) {
    // @ts-ignore
    const users = await stores.users.list({ cursor })
    total += users.keys.length
    cursor = users.cursor
    done = users.list_complete
  }
  return { total }
}

class ABITotals {
  constructor () {
    this.proposing = { total: 0 }
    this.accepted = { total: 0 }
    this.failed = { total: 0 }
    this.published = { total: 0 }
    this.active = { total: 0 }
    this.terminated = { total: 0 }
  }
}

class NftMetrics {
  constructor () {
    this.total = 0 // Total number of ABIs stored on abi.storage
    this.totalBytes = 0 // Total bytes of all ABIs
    this.storage = {
      ipfs: {
        total: 0 // Total number of ABIs pinned on IPFS
      },
      filecoin: {
        total: 0, // Total number of ABIs stored on Filecoin in active abis
        totalQueued: 0, // Total number of ABIs queued for the next abi batch
        abis: {
          mainnet: new ABITotals(),
          nerpanet: new ABITotals()
        }
      }
    }
  }
}

// TODO: keep running totals?
async function getNftMetrics () {
  const metrics = new NftMetrics()
  const seenABIs = new Set()
  let done = false
  let cursor
  while (!done) {
    // @ts-ignore
    const abiList = await stores.abis.list({ cursor, limit: 100 })
    metrics.total += abiList.keys.length
    // TODO: store cid & size in metadata so we don't have to query for each.
    // @ts-ignore
    const abiDatas = await Promise.all(abiList.keys.map(k => stores.abis.get(k.name)))
    // @ts-ignore
    const abis = await Promise.all(abiDatas.filter(Boolean).map(async d => {
      const abi = JSON.parse(d)
      abi.abis = await getABIs(abi.cid)
      return abi
    }))

    for (const abi of abis) {
      metrics.totalBytes += abi.size || 0
      if (abi.pin.status === 'pinned') {
        metrics.storage.ipfs.total++
      }
      for (const d of abi.abis) {
        const ntwk = d.network || 'unknown'
        // TODO: @riba will add a "key" to abis that is essentially this - switch to using it
        const key = `${ntwk}/${d.node}/${d.batchRootCid}`
        if (seenABIs.has(key)) continue
        seenABIs.add(key)
        if (d.status === 'queued') {
          metrics.storage.filecoin.totalQueued++
        } else {
          // @ts-ignore
          const abiTotals = metrics.storage.filecoin.abis[ntwk] = metrics.storage.filecoin.abis[ntwk] || new ABITotals()
          abiTotals[d.status] = abiTotals[d.status] || { total: 0 }
          abiTotals[d.status].total++
        }
      }
    }
    cursor = abiList.cursor
    done = abiList.list_complete
  }
  metrics.storage.filecoin.total = Object.values(metrics.storage.filecoin.abis)
      .reduce((total, abiTotals) => total + abiTotals.active.total, 0)
  return metrics
}

/**
 * Exports metrics in prometheus exposition format.
 * https://prometheus.io/docs/instrumenting/exposition_formats/
 * @param {{ userMetrics: { total: number }, abiMetrics: NftMetrics }} metrics
 * @returns {string}
 */
function exportPromMetrics ({ userMetrics, abiMetrics }) {
  return [
    '# HELP abistorage_users_total Total users registered.',
    '# TYPE abistorage_users_total counter',
    `abistorage_users_total ${userMetrics.total}`,
    '# HELP abistorage_abis_total Total number of ABIs stored.',
    '# TYPE abistorage_abis_total counter',
    `abistorage_abis_total ${abiMetrics.total}`,
    '# HELP abistorage_abis_bytes_total Total bytes of all ABIs.',
    '# TYPE abistorage_abistorage_abis_bytes_total counter',
    `abistorage_abis_bytes_total ${abiMetrics.totalBytes}`,
    '# HELP abistorage_abis_storage_ipfs_total Total number of ABIs pinned on IPFS.',
    '# TYPE abistorage_abis_storage_ipfs_total counter',
    `abistorage_abis_storage_ipfs_total ${abiMetrics.storage.ipfs.total}`,
    '# HELP abistorage_abis_storage_filecoin_total Total number of ABIs stored on Filecoin in active abis.',
    '# TYPE abistorage_abis_storage_filecoin_total counter',
    `abistorage_abis_storage_filecoin_total ${abiMetrics.storage.filecoin.total}`,
    '# HELP abistorage_abis_storage_filecoin_queued_total Total number of ABIs queued for the next abi batch.',
    '# TYPE abistorage_abis_storage_filecoin_queued_total counter',
    `abistorage_abis_storage_filecoin_queued_total ${abiMetrics.storage.filecoin.totalQueued}`,
    ...Object.entries(abiMetrics.storage.filecoin.abis).map(([ntwk, totals]) => [
      `# HELP abistorage_abis_storage_filecoin_abis_${ntwk}_total Total number of ABIs participating in Filecoin abis for ${ntwk}.`,
      `# TYPE abistorage_abis_storage_filecoin_abis_${ntwk}_total counter`,
      ...Object.entries(totals).map(([status, { total }]) => (
        `abistorage_abis_storage_filecoin_abis_${ntwk}_total{status="${status}"} ${total}`
      ))
    ].join('\n'))
  ].join('\n')
}
