import fs from 'fs'
import { ABIStorage, Blob } from 'abi.storage'

const endpoint = 'https://abi.storage' // the default
const token = 'API_KEY' // your API key from https://abi.storage/manage

async function main() {
  const store = new ABIStorage({ endpoint, token })
  const data = await fs.promises.readFile('single.js')
  const cid = await store.storeBlob(new Blob([data]))
  console.log({ cid })
  const status = await store.status(cid)
  console.log(status)
}
main()
