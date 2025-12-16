import { useState } from 'react'
import type { S3Credentials } from '../App'
import './S3Config.css'

interface S3ConfigProps {
  onConnect: (credentials: S3Credentials) => void
}

interface SavedConfig {
  id: string
  name: string
  region: string
  endpoint?: string
  forcePathStyle?: boolean
  accessKeyId: string
  createdAt: number
}

const STORAGE_KEY = 's3-browser-configs'

function S3Config({ onConnect }: S3ConfigProps) {
  // Load saved configurations from localStorage on initial render
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (err) {
      console.error('Failed to load saved configurations:', err)
      return []
    }
  })

  const [region, setRegion] = useState('us-east-1')
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [forcePathStyle, setForcePathStyle] = useState(false)
  const [configName, setConfigName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showSavedConfigs, setShowSavedConfigs] = useState(false)

  const saveConfiguration = () => {
    if (!configName.trim()) {
      alert('Please enter a name for this configuration')
      return
    }

    const newConfig: SavedConfig = {
      id: Date.now().toString(),
      name: configName.trim(),
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: endpoint ? forcePathStyle : undefined,
      accessKeyId,
      createdAt: Date.now(),
    }

    const updated = [...savedConfigs, newConfig]
    setSavedConfigs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setConfigName('')
    setShowSaveDialog(false)
    alert('Configuration saved successfully!')
  }

  const loadConfiguration = (config: SavedConfig) => {
    setRegion(config.region)
    setAccessKeyId(config.accessKeyId)
    setEndpoint(config.endpoint || '')
    setForcePathStyle(config.forcePathStyle || false)
    setShowSavedConfigs(false)
  }

  const deleteConfiguration = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return
    }
    const updated = savedConfigs.filter(c => c.id !== id)
    setSavedConfigs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

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
        <div className="config-header">
          <h2>Connect to S3</h2>
          {savedConfigs.length > 0 && (
            <button 
              type="button"
              onClick={() => setShowSavedConfigs(!showSavedConfigs)}
              className="btn-secondary btn-small"
            >
              {showSavedConfigs ? 'Hide' : 'Saved Configs'} ({savedConfigs.length})
            </button>
          )}
        </div>

        {showSavedConfigs && savedConfigs.length > 0 && (
          <div className="saved-configs-list">
            <h3>Saved Configurations</h3>
            {savedConfigs.map((config) => (
              <div key={config.id} className="saved-config-item">
                <div className="config-info">
                  <div className="config-name">{config.name}</div>
                  <div className="config-details">
                    {config.endpoint ? (
                      <span>🌐 {config.endpoint}</span>
                    ) : (
                      <span>☁️ AWS S3</span>
                    )}
                    {' • '}
                    <span>{config.region}</span>
                  </div>
                </div>
                <div className="config-actions">
                  <button
                    onClick={() => loadConfiguration(config)}
                    className="btn-action"
                    title="Load configuration"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => deleteConfiguration(config.id)}
                    className="btn-action btn-danger"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
          <div className="button-group">
            <button type="submit" className="btn-primary">
              Connect
            </button>
            <button 
              type="button" 
              onClick={() => setShowSaveDialog(true)}
              className="btn-secondary"
              disabled={!region || !accessKeyId}
            >
              💾 Save Config
            </button>
          </div>
        </form>

        {showSaveDialog && (
          <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Save Configuration</h3>
              <p className="modal-note">
                Only connection settings will be saved (not the secret key for security).
              </p>
              <div className="form-group">
                <label htmlFor="configName">Configuration Name</label>
                <input
                  type="text"
                  id="configName"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="e.g., My MinIO Server"
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button 
                  onClick={saveConfiguration}
                  disabled={!configName.trim()}
                  className="btn-primary"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setShowSaveDialog(false)
                    setConfigName('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
