export interface Service {
  endpoint: URL
  token: string
}

/**
 * CID in string representation
 */
export type CIDString = string & {}

export interface API {
  /**
   * Stores a single file and returns a corresponding CID.
   */
  storeBlob(service: Service, content: Blob | File): Promise<CIDString>
  /**
   * Stores a directory of files and returns a CID. Provided files **MUST**
   * be within a same directory, otherwise error is raised. E.g. `foo/bar.png`,
   * `foo/bla/baz.json` is ok but `foo/bar.png`, `bla/baz.json` is not.
   */
  storeDirectory(service: Service, files: Iterable<File>): Promise<CIDString>
  /**
   * Returns current status of the stored content by its CID.
   */
  status(service: Service, cid: string): Promise<StatusResult>
  /**
   * Removes stored content by its CID from the service. Please note that
   * even if content is removed from the service other nodes that have
   * replicated it might still continue providing it.
   */
  delete(service: Service, cid: string): Promise<void>
}

export interface StatusResult {
  cid: string
  size: number
  abis: ABIs
  pin: Pin
  created: Date
}

export type ABIs = OngoingABIs | FinalizedABIs

/**
 * In flight abis, once they are finilized transitions to `FinilizedABIs`
 * state.
 */
export interface OngoingABIs {
  readonly status: 'ongoing'
  /**
   * Array of ongoing abis. During this state `abis` array may change over
   * time.
   */
  abis: ABIs[]
}

/**
 * Finilized abis. In this state all the abis are finilized and are not going
 * to change.
 */
export interface FinalizedABIs {
  readonly status: 'finalized'
  readonly abis: FinalizedABIs[]
}

export type ABI = QueuedABI | PendingABI | PublishedABI | FinalizedABI

export interface QueuedABI {
  status: 'queued'
  sequence: number
  lastStatusChangeTimestamp: Date
}

export interface PendingABI {
  status: 'proposing' | 'rejected' | 'accepted' | 'errored'
  sequence: number
  lastStatusChangeTimestamp: Date
  node: string
}

export interface PublishedABI {
  status: 'published'
  sequence: number
  lastStatusChangeTimestamp: Date
  node: string
  chainABIId: number
}

export interface FinalizedABI {
  status: 'active' | 'terminated'
  sequence: number
  lastStatusChangeTimestamp: Date
  node: string
  chainABIId: number
  abiActivation: Date
  abiExpiration: Date
}

export interface Pin {
  // Pinata does not provide this
  // requestid: string
  cid: CIDString
  name?: string
  status: PinStatus
  created: Date
}

export type PinStatus = 'queued' | 'pinning' | 'pinned' | 'failed'
