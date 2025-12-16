import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  S3Client, 
  ListObjectsV2Command, 
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import type { S3Credentials } from '../App'
import './S3Browser.css'

interface S3BrowserProps {
  credentials: S3Credentials
  initialPrefix?: string
  onDisconnect: () => void
  onBackToBuckets?: () => void
}

interface S3Object {
  key: string
  size: number
  lastModified: Date
  isFolder: boolean
}

function S3Browser({ credentials, initialPrefix = '', onDisconnect, onBackToBuckets }: S3BrowserProps) {
  const navigate = useNavigate()
  const [objects, setObjects] = useState<S3Object[]>([])
  const [currentPrefix, setCurrentPrefix] = useState(initialPrefix)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Update currentPrefix when initialPrefix changes (from URL)
  useEffect(() => {
    setCurrentPrefix(initialPrefix)
  }, [initialPrefix])

  const s3Client = useMemo(() => {
    const config = {
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
      ...(credentials.endpoint && { endpoint: credentials.endpoint }),
      ...(credentials.forcePathStyle && { forcePathStyle: credentials.forcePathStyle }),
    }
    
    return new S3Client(config)
  }, [credentials.region, credentials.accessKeyId, credentials.secretAccessKey, credentials.endpoint, credentials.forcePathStyle])

  const loadObjects = useCallback(async (prefix: string = '') => {
    setLoading(true)
    setError(null)
    try {
      const command = new ListObjectsV2Command({
        Bucket: credentials.bucket,
        Prefix: prefix,
        Delimiter: '/',
      })
      const response = await s3Client.send(command)
      
      const folders: S3Object[] = (response.CommonPrefixes || []).map(cp => ({
        key: cp.Prefix || '',
        size: 0,
        lastModified: new Date(),
        isFolder: true,
      }))

      const files: S3Object[] = (response.Contents || [])
        .filter(obj => obj.Key !== prefix) // Filter out the prefix itself
        .map(obj => ({
          key: obj.Key || '',
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date(),
          isFolder: false,
        }))

      setObjects([...folders, ...files])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load objects')
      console.error('Error loading objects:', err)
    } finally {
      setLoading(false)
    }
  }, [credentials.bucket, s3Client])

  useEffect(() => {
    loadObjects(currentPrefix)
  }, [currentPrefix, loadObjects])

  const handleNavigate = (key: string) => {
    if (key.endsWith('/')) {
      // Update URL with new path
      const newPath = `/browse/${credentials.bucket}/${key}`
      navigate(newPath)
    }
  }

  const handleBack = () => {
    if (currentPrefix) {
      const parts = currentPrefix.split('/').filter(p => p)
      parts.pop()
      const newPrefix = parts.length > 0 ? parts.join('/') + '/' : ''
      const newPath = newPrefix 
        ? `/browse/${credentials.bucket}/${newPrefix}`
        : `/browse/${credentials.bucket}`
      navigate(newPath)
    }
  }

  const handleDelete = async (key: string) => {
    if (!window.confirm(`Are you sure you want to delete ${key}?`)) {
      return
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: credentials.bucket,
        Key: key,
      })
      await s3Client.send(command)
      loadObjects(currentPrefix)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete object')
      console.error('Error deleting object:', err)
    }
  }

  const handleDownload = async (key: string) => {
    try {
      const command = new GetObjectCommand({
        Bucket: credentials.bucket,
        Key: key,
      })
      const response = await s3Client.send(command)
      
      if (!response.Body) {
        throw new Error('No response body received from S3')
      }

      const blob = await response.Body.transformToByteArray()
      const url = URL.createObjectURL(new Blob([blob]))
      const a = document.createElement('a')
      a.href = url
      a.download = key.split('/').pop() || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download object')
      console.error('Error downloading object:', err)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) return

    try {
      const key = currentPrefix + uploadFile.name
      // Convert File to ArrayBuffer for browser compatibility
      const arrayBuffer = await uploadFile.arrayBuffer()
      const command = new PutObjectCommand({
        Bucket: credentials.bucket,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: uploadFile.type || 'application/octet-stream',
      })
      await s3Client.send(command)
      setUploadFile(null)
      loadObjects(currentPrefix)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      console.error('Error uploading file:', err)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  const getBreadcrumbs = () => {
    if (!currentPrefix) return []
    const parts = currentPrefix.split('/').filter(p => p)
    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join('/') + '/',
    }))
  }

  return (
    <div className="s3-browser">
      <div className="browser-header">
        <div className="bucket-info">
          <h2>{credentials.bucket}</h2>
          <div className="header-buttons">
            {onBackToBuckets && (
              <button onClick={onBackToBuckets} className="btn-secondary">
                ← Back to Buckets
              </button>
            )}
            <button onClick={onDisconnect} className="btn-secondary">
              Disconnect
            </button>
          </div>
        </div>
        <div className="breadcrumb">
          <button 
            onClick={() => navigate(`/browse/${credentials.bucket}`)} 
            className="breadcrumb-item"
          >
            Root
          </button>
          {getBreadcrumbs().map((crumb, index) => (
            <span key={index}>
              <span className="breadcrumb-separator">/</span>
              <button 
                onClick={() => navigate(`/browse/${credentials.bucket}/${crumb.path}`)} 
                className="breadcrumb-item"
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="browser-actions">
        <div className="upload-section">
          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            id="file-input"
          />
          <button
            onClick={handleUpload}
            disabled={!uploadFile}
            className="btn-primary"
          >
            Upload File
          </button>
        </div>
        {currentPrefix && (
          <button onClick={handleBack} className="btn-secondary">
            ← Back
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="objects-container">
          <table className="objects-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {objects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-message">
                    No objects found
                  </td>
                </tr>
              ) : (
                objects.map((obj) => (
                  <tr key={obj.key}>
                    <td>
                      {obj.isFolder ? (
                        <button 
                          onClick={() => handleNavigate(obj.key)}
                          className="folder-link"
                        >
                          📁 {obj.key.replace(currentPrefix, '').replace('/', '')}
                        </button>
                      ) : (
                        <span className="file-name">
                          📄 {obj.key.replace(currentPrefix, '')}
                        </span>
                      )}
                    </td>
                    <td>{formatSize(obj.size)}</td>
                    <td>{obj.isFolder ? '-' : formatDate(obj.lastModified)}</td>
                    <td>
                      {!obj.isFolder && (
                        <div className="action-buttons">
                          <button
                            onClick={() => handleDownload(obj.key)}
                            className="btn-action"
                            title="Download"
                          >
                            ⬇️
                          </button>
                          <button
                            onClick={() => handleDelete(obj.key)}
                            className="btn-action btn-danger"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
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

export default S3Browser
