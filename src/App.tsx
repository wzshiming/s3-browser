import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { Layout, Flex, ConfigProvider, theme } from 'antd';
import { S3Client } from '@aws-sdk/client-s3';
import EndpointManager from './components/EndpointManager';
import BucketManager from './components/BucketManager';
import ObjectManager from './components/ObjectManager';
import FileDetail from './components/FileDetail';
import ProgressBar from './components/ProgressBar';
import NavigationBar from './components/NavigationBar';
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


const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const subscribeDarkMode = (callback: () => void) => {
  darkModeQuery.addEventListener('change', callback);
  return () => darkModeQuery.removeEventListener('change', callback);
};
const getIsDarkMode = () => darkModeQuery.matches;

function App() {
  const isDarkMode = useSyncExternalStore(subscribeDarkMode, getIsDarkMode);
  const { endpointName, bucket, path } = parseHash();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>(endpointName);
  const [selectedBucket, setSelectedBucket] = useState<string>(bucket);
  const [currentPath, setCurrentPath] = useState<string>(path);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cardExtra, setCardExtra] = useState<React.ReactNode>(null);

  const handleHashChange = () => {
    const { endpointName, bucket, path } = parseHash();
    setSelectedEndpoint(endpointName);
    setSelectedBucket(bucket);
    setCurrentPath(path);
  };

  window.addEventListener('hashchange', handleHashChange);

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
    const { endpointName } = parseHash();
    updateHash(endpointName, bucket, '');
  };

  const handleBackToBuckets = () => {
    const { endpointName } = parseHash();
    updateHash(endpointName, '', '');
  };

  const handlePathChange = (path: string) => {
    const { endpointName, bucket } = parseHash();
    updateHash(endpointName, bucket, path);
  };

  const handleSelectEndpoint = (endpoint: string) => {
    updateHash(endpoint, '', '');
  };

  const handleBackToEndpoints = () => {
    updateHash('', '', '');
  };

  // Determine which layer to show
  const renderContent = () => {
    if (!selectedEndpoint) {
      // No endpoint selected: show endpoint management (full page)
      return (
        <EndpointManager
          onSelectEndpoint={handleSelectEndpoint}
          setCardExtra={setCardExtra}
        />
      );
    }

    if (!selectedBucket) {
      // Endpoint selected but no bucket: show bucket management (full page)
      return (
        <BucketManager
          client={s3Client}
          onSelectBucket={handleSelectBucket}
          setCardExtra={setCardExtra}
        />
      );
    }


    // Check if currentPath points to a file (non-empty and doesn't end with '/')
    if (currentPath && !currentPath.endsWith('/')) {
      return (
        <FileDetail
          client={s3Client}
          bucketName={selectedBucket}
          filePath={currentPath}
          onPathChange={handlePathChange}
          setCardExtra={setCardExtra}
        />
      );
    }

    // Bucket selected: show object management (full page)
    return (
      <ObjectManager
        client={s3Client}
        bucketName={selectedBucket}
        currentPath={currentPath}
        onPathChange={handlePathChange}
        setUploading={setUploading}
        setUploadProgress={setUploadProgress}
        setCardExtra={setCardExtra}
      />
    );
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <ProgressBar enable={uploading} percent={uploadProgress} />
        <Layout.Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 'auto',
            lineHeight: 'normal',
            padding: '16px 24px',
          }}
        >
          <NavigationBar
            endpointName={selectedEndpoint || undefined}
            bucketName={selectedBucket || undefined}
            path={currentPath || undefined}
            onNavigateEndpoints={selectedEndpoint ? handleBackToEndpoints : undefined}
            onNavigateBuckets={selectedBucket ? handleBackToBuckets : undefined}
            onNavigatePath={selectedBucket ? handlePathChange : undefined}
          />
          {cardExtra && (
            <Flex gap="small" align="center" style={{ marginLeft: 16 }}>
              {cardExtra}
            </Flex>
          )}
        </Layout.Header>
        <Layout.Content style={{ padding: '16px 24px' }}>
          {renderContent()}
        </Layout.Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
