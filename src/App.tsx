import { useState, useMemo } from 'react'
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
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)

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
    setSelectedBucket(null)
  }

  const handleDisconnect = () => {
    setCredentials(null)
    setSelectedBucket(null)
  }

  const handleSelectBucket = (bucketName: string) => {
    setSelectedBucket(bucketName)
  }

  const handleBackToBuckets = () => {
    setSelectedBucket(null)
  }

  const currentCredentials = credentials && selectedBucket 
    ? { ...credentials, bucket: selectedBucket }
    : credentials

  return (
    <div className="app">
      <header className="app-header">
        <h1>S3 Browser</h1>
      </header>
      <main className="app-main">
        {!credentials ? (
          <S3Config onConnect={handleConnect} />
        ) : selectedBucket && currentCredentials ? (
          <S3Browser 
            credentials={currentCredentials} 
            onDisconnect={handleDisconnect}
            onBackToBuckets={handleBackToBuckets}
          />
        ) : s3Client ? (
          <BucketManager 
            credentials={credentials}
            s3Client={s3Client}
            onSelectBucket={handleSelectBucket}
            onDisconnect={handleDisconnect}
          />
        ) : null}
      </main>
    </div>
  )
}

export default App
