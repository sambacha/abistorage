/** @export bindings */
export {}

declare global {
  const AUTH0_DOMAIN: string
  const AUTH0_CLIENT_ID: string
  const AUTH0_CLIENT_SECRET: string
  const AUTH0_CALLBACK_URL: string
  const SALT: string
  const DEBUG: string
  const SESSION: KVNamespace
  const CSRF: KVNamespace
  const DEALS: KVNamespace
  const USERS: KVNamespace
  const ABIS: KVNamespace
  const PINATA_JWT: string
}

export interface Pin {
  /**
   * Content Identifier for the ABI data.
   */
  cid: string
  name?: string
  status: PinStatus
  created: string
  size: number
}

export type PinStatus = 'queued' | 'pinning' | 'pinned' | 'failed'

export type ABI = {
  /**
   * Content Identifier for the ABI data.
   */
  cid: string
  /**
   * Size in bytes of the ABI data.
   */
  size: number
  /**
   * Type of the data: "directory" or Blob.type.
   */
  type: string
  /**
   * Files in the directory (only if this ABI is a directory).
   */
  files: Array<{ name: string; type: string }>
  /**
   * Pinata pin data.
   */
  pin: Pin
  /**
   * Name of the JWT token used to create this ABI.
   */
  scope: string
  /**
   * Date this ABI was created in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format: YYYY-MM-DDTHH:MM:SSZ.
   */
  created: string
  /**
   * ABIs
   */
  abis?: {
    /**
     * Overall abi status
     */
    status: 'ongoing' | 'finalized'
    abis: ABI[]
  }
}

export interface ABI {
  /**
   * CID string
   */
  batchRootCid: string
  /**
   * Timestamp in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format: YYYY-MM-DDTHH:MM:SSZ.
   */
  lastChanged: string
  /**
   * Node ID
   */
  node?: string
  /**
   * Filecoin network for this ABI
   */
  network?: 'nerpanet' | 'mainnet'
  /**
   * Piece CID string
   */
  pieceCid?: string
  /**
   * ABI Status
   */
  status:
    | 'queued'
    | 'proposing'
    | 'accepted'
    | 'failed'
    | 'active'
    | 'published'
    | 'terminated'
  /**
   * ABI Status Description
   */
  statusText?: string
  /**
   * Identifier for the abi stored on chain.
   */
  chainABIID?: number
  /**
   * ABI Activation
   *
   * Timestamp in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format: YYYY-MM-DDTHH:MM:SSZ.
   */
  abiActivation?: string
  /**
   * ABI Moribund
   * 
   *
   * Timestamp in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format: YYYY-MM-DDTHH:MM:SSZ.
   */
  abiMoribund?: string
}
