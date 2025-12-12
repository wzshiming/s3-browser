import { useState } from 'react'
import './App.css'
import S3Config from './components/S3Config'
import S3Browser from './components/S3Browser'

export interface S3Credentials {
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

function App() {
  const [credentials, setCredentials] = useState<S3Credentials | null>(null)

  const handleConnect = (creds: S3Credentials) => {
    setCredentials(creds)
  }

  const handleDisconnect = () => {
    setCredentials(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>S3 Browser</h1>
      </header>
      <main className="app-main">
        {!credentials ? (
          <S3Config onConnect={handleConnect} />
        ) : (
          <S3Browser credentials={credentials} onDisconnect={handleDisconnect} />
        )}
      </main>
    </div>
  )
}

export default App
