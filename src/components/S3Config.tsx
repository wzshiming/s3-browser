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
  const [endpoint, setEndpoint] = useState('')
  const [forcePathStyle, setForcePathStyle] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (region && accessKeyId && secretAccessKey) {
      onConnect({
        region,
        accessKeyId,
        secretAccessKey,
        endpoint: endpoint || undefined,
        forcePathStyle: endpoint ? forcePathStyle : undefined,
      })
    }
  }

  return (
    <div className="s3-config">
      <div className="config-card">
        <h2>Connect to S3</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="endpoint">
              Endpoint (Optional)
              <span className="label-hint">Leave empty for AWS S3</span>
            </label>
            <input
              type="text"
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://s3.example.com or http://localhost:9000"
            />
          </div>
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
          {endpoint && (
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={forcePathStyle}
                  onChange={(e) => setForcePathStyle(e.target.checked)}
                />
                <span>Force Path Style (required for MinIO and some S3-compatible services)</span>
              </label>
            </div>
          )}
          <button type="submit" className="btn-primary">
            Connect
          </button>
        </form>
        <div className="config-note">
          <p>
            <strong>Note:</strong> Your credentials are stored only in memory and never sent to any server except your S3 service.
          </p>
        </div>
      </div>
    </div>
  )
}

export default S3Config
