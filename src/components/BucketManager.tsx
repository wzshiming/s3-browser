import { useState, useEffect, useCallback } from 'react'
import { 
  S3Client, 
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
} from '@aws-sdk/client-s3'
import type { S3Credentials } from '../App'
import './BucketManager.css'

interface BucketManagerProps {
  credentials: S3Credentials
  s3Client: S3Client
  onSelectBucket: (bucketName: string) => void
  onDisconnect: () => void
}

interface Bucket {
  name: string
  creationDate: Date
}

function BucketManager({ credentials, s3Client, onSelectBucket, onDisconnect }: BucketManagerProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [creating, setCreating] = useState(false)

  const loadBuckets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const command = new ListBucketsCommand({})
      const response = await s3Client.send(command)
      
      const bucketList: Bucket[] = (response.Buckets || []).map(b => ({
        name: b.Name || '',
        creationDate: b.CreationDate || new Date(),
      }))

      setBuckets(bucketList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load buckets')
      console.error('Error loading buckets:', err)
    } finally {
      setLoading(false)
    }
  }, [s3Client])

  useEffect(() => {
    loadBuckets()
  }, [loadBuckets])

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      setError('Bucket name is required')
      return
    }

    setCreating(true)
    setError(null)
    try {
      const command = new CreateBucketCommand({
        Bucket: newBucketName.trim(),
      })
      await s3Client.send(command)
      setNewBucketName('')
      setShowCreateDialog(false)
      loadBuckets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bucket')
      console.error('Error creating bucket:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteBucket = async (bucketName: string) => {
    if (!window.confirm(`Are you sure you want to delete bucket "${bucketName}"? This action cannot be undone.`)) {
      return
    }

    setError(null)
    try {
      const command = new DeleteBucketCommand({
        Bucket: bucketName,
      })
      await s3Client.send(command)
      loadBuckets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bucket. Make sure the bucket is empty.')
      console.error('Error deleting bucket:', err)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  return (
    <div className="bucket-manager">
      <div className="manager-header">
        <div className="header-title">
          <h2>Bucket Management</h2>
          <p className="endpoint-info">
            {credentials.endpoint ? (
              <>Endpoint: <code>{credentials.endpoint}</code></>
            ) : (
              <>AWS S3 - Region: <code>{credentials.region}</code></>
            )}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowCreateDialog(true)} className="btn-primary">
            + Create Bucket
          </button>
          <button onClick={onDisconnect} className="btn-secondary">
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {showCreateDialog && (
        <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Bucket</h3>
            <div className="form-group">
              <label htmlFor="bucketName">Bucket Name</label>
              <input
                type="text"
                id="bucketName"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                placeholder="my-new-bucket"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button 
                onClick={handleCreateBucket} 
                disabled={creating || !newBucketName.trim()}
                className="btn-primary"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button 
                onClick={() => {
                  setShowCreateDialog(false)
                  setNewBucketName('')
                  setError(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading buckets...</div>
      ) : (
        <div className="buckets-container">
          <table className="buckets-table">
            <thead>
              <tr>
                <th>Bucket Name</th>
                <th>Creation Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buckets.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-message">
                    No buckets found. Create one to get started.
                  </td>
                </tr>
              ) : (
                buckets.map((bucket) => (
                  <tr key={bucket.name}>
                    <td>
                      <button 
                        onClick={() => onSelectBucket(bucket.name)}
                        className="bucket-link"
                      >
                        🪣 {bucket.name}
                      </button>
                    </td>
                    <td>{formatDate(bucket.creationDate)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => onSelectBucket(bucket.name)}
                          className="btn-action"
                          title="Browse"
                        >
                          📂
                        </button>
                        <button
                          onClick={() => handleDeleteBucket(bucket.name)}
                          className="btn-action btn-danger"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default BucketManager
