import { useState } from 'react'
import type { S3Credentials } from '../App'
import './S3Config.css'

interface S3ConfigProps {
  onConnect: (credentials: S3Credentials) => void
}

function S3Config({ onConnect }: S3ConfigProps) {
  const [region, setRegion] = useState('us-east-1')
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [bucket, setBucket] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (region && accessKeyId && secretAccessKey && bucket) {
      onConnect({
        region,
        accessKeyId,
        secretAccessKey,
        bucket,
      })
    }
  }

  return (
    <div className="s3-config">
      <div className="config-card">
        <h2>Connect to S3 Bucket</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="region">Region</label>
            <input
              type="text"
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="us-east-1"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="bucket">Bucket Name</label>
            <input
              type="text"
              id="bucket"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="my-bucket"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="accessKeyId">Access Key ID</label>
            <input
              type="text"
              id="accessKeyId"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="secretAccessKey">Secret Access Key</label>
            <input
              type="password"
              id="secretAccessKey"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder="Your AWS Secret Access Key"
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            Connect
          </button>
        </form>
        <div className="config-note">
          <p>
            <strong>Note:</strong> Your credentials are stored only in memory and never sent to any server except AWS S3.
          </p>
        </div>
      </div>
    </div>
  )
}

export default S3Config
