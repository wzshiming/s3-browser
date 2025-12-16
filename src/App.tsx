import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { S3Client } from '@aws-sdk/client-s3'
import './App.css'
import S3Config from './components/S3Config'
import S3Browser from './components/S3Browser'
import BucketManager from './components/BucketManager'

export interface S3Credentials {
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket?: string
  endpoint?: string
  forcePathStyle?: boolean
}

function App() {
  const [credentials, setCredentials] = useState<S3Credentials | null>(null)
  const navigate = useNavigate()
  const params = useParams()

  // Extract bucket and path from URL
  const bucketFromUrl = params['*']?.split('/')[0] || null
  const pathFromUrl = params['*']?.split('/').slice(1).join('/') || ''

  const s3Client = useMemo(() => {
    if (!credentials) return null
    
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
  }, [credentials])

  const handleConnect = (creds: S3Credentials) => {
    setCredentials(creds)
    // If there's already a bucket in the URL, stay on that page
    // Otherwise, navigate to buckets list
    if (!bucketFromUrl) {
      navigate('/buckets')
    }
    // If bucketFromUrl exists, we stay on the current URL which will show the browser
  }

  const handleDisconnect = () => {
    setCredentials(null)
    navigate('/')
  }

  const handleSelectBucket = (bucketName: string) => {
    navigate(`/browse/${bucketName}`)
  }

  const handleBackToBuckets = () => {
    navigate('/buckets')
  }

  const currentCredentials = credentials && bucketFromUrl 
    ? { ...credentials, bucket: bucketFromUrl }
    : credentials

  // Determine which component to show based on URL
  const renderContent = () => {
    if (!credentials) {
      return <S3Config onConnect={handleConnect} />
    }

    if (!s3Client) {
      return null
    }

    // If URL has a bucket, show the browser
    if (bucketFromUrl && currentCredentials) {
      return (
        <S3Browser 
          credentials={currentCredentials}
          initialPrefix={pathFromUrl}
          onDisconnect={handleDisconnect}
          onBackToBuckets={handleBackToBuckets}
        />
      )
    }

    // Otherwise show bucket manager
    return (
      <BucketManager 
        credentials={credentials}
        s3Client={s3Client}
        onSelectBucket={handleSelectBucket}
        onDisconnect={handleDisconnect}
      />
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>S3 Browser</h1>
      </header>
      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
