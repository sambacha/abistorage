import useSWR from 'swr'
import { ABIStorage } from 'abi.storage'
import { useState } from 'react'
import Box from '../components/box.js'
import Button from '../components/button.js'
import { getEdgeState } from '../lib/state.js'
import Layout from '../components/layout.js'

export default function NewFile() {
  const { data } = useSWR('edge_state', getEdgeState)
  const { user, loginUrl = '#' } = data ?? {}
  const hasToken = Boolean(user && Object.keys(user.tokens).length)
  const [uploading, setUploading] = useState(false)

  return (
    <Layout
      user={user}
      loginUrl={loginUrl}
      navBgColor="nsyellow"
      title="Upload File - ABI Storage"
    >
      <main className="bg-nsyellow">
        <div className="mw9 center pv3 ph5 min-vh-100">
          <Box
            bgColor="nsgray"
            borderColor="nspink"
            wrapperClassName="center mv4 mw6"
          >
            <h1 className="chicagoflf f4 fw4">Upload File</h1>
            {hasToken ? (
              <form onSubmit={handleUploadSubmit}>
                <div className="mv3">
                  <label htmlFor="name" className="dib mb2">
                    File:
                  </label>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    className="db ba b--black w5 pa2"
                    required
                  />
                </div>
                <div className="mv3">
                  {uploading ? (
                    <Button className="bg-light-gray" href="#">
                      Uploading...
                    </Button>
                  ) : (
                    <Button className="bg-nslime" type="submit">
                      Upload
                    </Button>
                  )}
                </div>
                <div>
                  <p className="lh-copy f7">100MB upload limit per file.</p>
                  <p className="lh-copy f7">
                    You can also upload files using the{' '}
                    <a href="/#js-client" className="black">
                      JS Client Library
                    </a>
                    ,{' '}
                    <a href="/#raw-http-request" className="black">
                      Raw HTTP Requests
                    </a>{' '}
                    or via the{' '}
                    <a
                      href="/#configure-as-a-remote-pinning-service"
                      className="black"
                    >
                      Remote Pinning Service API
                    </a>
                    .
                  </p>
                </div>
              </form>
            ) : (
              <>
                <p className="lh-copy">No API keys!</p>
                <p className="lh-copy">
                  Create an API key first and then re-try uploading a file.
                </p>
                <Button href="/new-key">+ New Key</Button>
              </>
            )}
          </Box>
        </div>
      </main>
    </Layout>
  )

  async function handleUploadSubmit(e) {
    e.preventDefault()
    const file = e.target.file
    const token = user.tokens['default'] || Object.values(user.tokens)[0]
    const client = new ABIStorage({ token, endpoint: location.origin })
    setUploading(true)
    try {
      await client.storeBlob(file.files[0])
    } finally {
      setUploading(false)
    }
    location = '/files'
  }
}
