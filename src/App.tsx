import { useState, useCallback, useMemo } from 'react';
import { Layout, ConfigProvider, theme } from 'antd';
import { S3Client } from '@aws-sdk/client-s3';
import EndpointManager from './components/EndpointManager';
import BucketManager from './components/BucketManager';
import ObjectManager from './components/ObjectManager';
import FileDetail from './components/FileDetail';
import { createS3Client } from './services/s3Client';
import { loadEndpoints } from './services/storage';
import './App.css';

// Parse hash to get current location and endpoint name
const parseHash = (): { endpointName: string; bucket: string; path: string } => {
  const hash = window.location.hash.slice(1); // Remove #
  if (!hash) return { endpointName: '', bucket: '', path: '' };

  const parts = hash.split('/');

  const endpointName = parts[0];
  const bucket = parts.length > 1 ? parts[1] : '';
  const path = parts.length > 2 ? parts.slice(2).join('/') : '';
  return { endpointName: endpointName, bucket, path };
};

// Update hash based on current location
const updateHash = (endpointName: string, bucket: string, path: string) => {
  if (!endpointName) {
    window.location.hash = '';
  } else if (!bucket) {
    window.location.hash = endpointName;
  } else if (!path) {
    window.location.hash = endpointName + '/' + bucket;
  } else {
    window.location.hash = endpointName + '/' + bucket + '/' + path;
  }
};


function App() {
  const { endpointName, bucket, path } = parseHash();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>(endpointName);
  const [selectedBucket, setSelectedBucket] = useState<string>(bucket);
  const [currentPath, setCurrentPath] = useState<string>(path);


  // Create S3 client when endpoint changes using useMemo
  const s3Client = useMemo<S3Client | null>(() => {
    if (selectedEndpoint) {
      const endpoints = loadEndpoints();
      const endpoint = endpoints.find(ep => ep.name === selectedEndpoint);
      if (endpoint) {
        return createS3Client(endpoint);
      }
      return null;
    }
    return null;
  }, [selectedEndpoint]);

  const handleSelectBucket = (bucket: string) => {
    setSelectedBucket(bucket);
    setCurrentPath('');
    const { endpointName } = parseHash();
    updateHash(endpointName, bucket, '');
  };

  const handleBackToBuckets = () => {
    setSelectedBucket('');
    setCurrentPath('');
    const { endpointName } = parseHash();
    updateHash(endpointName, '', '');
  };

  const handlePathChange = (path: string) => {
    setCurrentPath(path);
    const { endpointName, bucket } = parseHash();
    updateHash(endpointName, bucket, path);
  };

  const handleSelectEndpoint = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    updateHash(endpoint, '', '');
  };

  const handleBackToEndpoints = useCallback(() => {
    setSelectedEndpoint('');
    setSelectedBucket('');
    setCurrentPath('');
    updateHash('', '', '');
  }, []);

  // Determine which layer to show
  const renderContent = () => {
    if (!selectedEndpoint) {
      // No endpoint selected: show endpoint management (full page)
      return (
        <EndpointManager
          selectedEndpoint={selectedEndpoint}
          onSelectEndpoint={handleSelectEndpoint}
        />
      );
    }

    if (!selectedBucket) {
      // Endpoint selected but no bucket: show bucket management (full page)
      return (
        <BucketManager
          client={s3Client}
          selectedBucket={selectedBucket}
          onSelectBucket={handleSelectBucket}
          onBackToEndpoints={handleBackToEndpoints}
          endpointName={selectedEndpoint}
        />
      );
    }


    // Check if currentPath points to a file (non-empty and doesn't end with '/')
    if (currentPath && !currentPath.endsWith('/')) {
      return (
        <FileDetail
          client={s3Client}
          selectedBucket={selectedBucket}
          filePath={currentPath}
          onPathChange={handlePathChange}
          onBackToBuckets={handleBackToBuckets}
          onBackToEndpoints={handleBackToEndpoints}
          endpointName={selectedEndpoint}
        />
      );
    }

    // Bucket selected: show object management (full page)
    return (
      <ObjectManager
        client={s3Client}
        selectedBucket={selectedBucket}
        currentPath={currentPath}
        onPathChange={handlePathChange}
        onBackToBuckets={handleBackToBuckets}
        onBackToEndpoints={handleBackToEndpoints}
        endpointName={selectedEndpoint}
      />
    );
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {renderContent()}
      </Layout>
    </ConfigProvider>
  );
}

export default App;
