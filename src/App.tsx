import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout, Typography, ConfigProvider, theme } from 'antd';
import { S3Client } from '@aws-sdk/client-s3';
import EndpointManager from './components/EndpointManager';
import BucketManager from './components/BucketManager';
import ObjectManager from './components/ObjectManager';
import FileDetail from './components/FileDetail';
import type { S3Endpoint } from './types';
import { createS3Client } from './services/s3Client';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

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

// Get initial state from hash
const getInitialState = () => {
  const { bucket, path } = parseHash();
  return {
    selectedBucket: bucket,
    currentPath: path,
    showObjects: !!bucket,
  };
};

function App() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<S3Endpoint | null>(null);
  const initialState = getInitialState();
  const [selectedBucket, setSelectedBucket] = useState<string | null>(initialState.selectedBucket);
  const [currentPath, setCurrentPath] = useState<string>(initialState.currentPath);
  const [showObjects, setShowObjects] = useState(initialState.showObjects);

  // Create S3 client when endpoint changes using useMemo
  const s3Client = useMemo<S3Client | null>(() => {
    if (selectedEndpoint) {
      return createS3Client(selectedEndpoint);
    }
    return null;
  }, [selectedEndpoint]);

  // Listen for hash changes (subscription pattern)
  useEffect(() => {
    const handleHashChange = () => {
      const { bucket, path } = parseHash();
      setSelectedBucket(bucket);
      setCurrentPath(path);
      setShowObjects(!!bucket);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [selectedEndpoint]);

  // Update hash when endpoint/bucket/path changes
  useEffect(() => {
    const endpointName = selectedEndpoint?.name ?? '';
    if (showObjects && selectedBucket) {
      updateHash(endpointName, selectedBucket, currentPath);
    } else if (!showObjects) {
      updateHash(endpointName, '', '');
    }
  }, [selectedEndpoint, selectedBucket, currentPath, showObjects]);

  const handleSelectBucket = useCallback((bucket: string | null) => {
    setSelectedBucket(bucket);
    if (bucket) {
      setCurrentPath('');
      setShowObjects(true);
    }
  }, []);

  const handleBackToBuckets = useCallback(() => {
    setShowObjects(false);
    setSelectedBucket(null);
    setCurrentPath('');
  }, []);

  const handlePathChange = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const handleSelectEndpoint = useCallback((endpoint: S3Endpoint | null) => {
    setSelectedEndpoint(endpoint);
  }, []);

  const handleBackToEndpoints = useCallback(() => {
    setSelectedEndpoint(null);
    setShowObjects(false);
    setSelectedBucket(null);
    setCurrentPath('');
    // Clear the hash immediately so EndpointManager won't auto-select
    window.location.hash = '';
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

    if (showObjects && selectedBucket) {
      // Check if currentPath points to a file (non-empty and doesn't end with '/')
      if (currentPath && !currentPath.endsWith('/')) {
        return (
          <FileDetail
            client={s3Client}
            selectedBucket={selectedBucket}
            filePath={currentPath}
            onPathChange={handlePathChange}
            onBackToBuckets={handleBackToBuckets}
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
        />
      );
    }

    // Endpoint selected but no bucket: show bucket management (full page)
    return (
      <BucketManager
        client={s3Client}
        selectedBucket={selectedBucket}
        onSelectBucket={handleSelectBucket}
        onBackToEndpoints={handleBackToEndpoints}
        endpointName={selectedEndpoint.name}
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
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#001529',
            padding: '0 24px',
          }}
        >
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            S3 Browser
          </Title>
        </Header>
        <Content
          style={{
            padding: 12,
            background: '#f0f2f5',
            overflow: 'auto',
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
