import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout, Typography, ConfigProvider, theme, Drawer, Button, Grid } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { S3Client } from '@aws-sdk/client-s3';
import EndpointManager from './components/EndpointManager';
import BucketManager from './components/BucketManager';
import ObjectManager from './components/ObjectManager';
import type { S3Endpoint } from './types';
import { createS3Client } from './services/s3Client';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// Parse hash to get current location
const parseHash = (): { bucket: string | null; path: string } => {
  const hash = window.location.hash.slice(1); // Remove #
  if (!hash) return { bucket: null, path: '' };

  const parts = hash.split('/');
  const bucket = parts[0] || null;
  const path = parts.slice(1).join('/');

  return { bucket, path };
};

// Update hash based on current location
const updateHash = (bucket: string | null, path: string) => {
  if (!bucket) {
    window.location.hash = '';
  } else if (path) {
    window.location.hash = bucket + '/' + path;
  } else {
    window.location.hash = bucket;
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
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Use Ant Design's responsive breakpoint hook
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md breakpoint is 768px

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
  }, []);

  // Update hash when bucket/path changes
  useEffect(() => {
    if (showObjects && selectedBucket) {
      updateHash(selectedBucket, currentPath);
    } else if (!showObjects) {
      updateHash(null, '');
    }
  }, [selectedBucket, currentPath, showObjects]);

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
    // Close drawer on mobile after selecting endpoint
    if (isMobile) {
      setDrawerVisible(false);
    }
  }, [isMobile]);

  // Endpoint manager component (shared between sidebar and drawer)
  const endpointManagerContent = (
    <EndpointManager
      selectedEndpoint={selectedEndpoint}
      onSelectEndpoint={handleSelectEndpoint}
    />
  );

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
            justifyContent: 'space-between',
            background: '#001529',
            padding: isMobile ? '0 12px' : '0 24px',
          }}
        >
          <Title level={isMobile ? 4 : 3} style={{ color: '#fff', margin: 0 }}>
            S3 Browser
          </Title>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: '#fff', fontSize: 20 }} />}
              onClick={() => setDrawerVisible(true)}
              style={{ padding: '4px 8px' }}
            />
          )}
        </Header>
        <Layout>
          {/* Desktop sidebar */}
          {!isMobile && (
            <Sider
              width={350}
              style={{
                background: '#fff',
                padding: 16,
                overflow: 'auto',
              }}
            >
              {endpointManagerContent}
            </Sider>
          )}

          {/* Mobile drawer */}
          <Drawer
            title="S3 Endpoints"
            placement="left"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            styles={{ body: { padding: 16 } }}
          >
            {endpointManagerContent}
          </Drawer>

          <Content
            style={{
              padding: 12,
              background: '#f0f2f5',
              overflow: 'auto',
            }}
          >
            {showObjects && selectedBucket ? (
              <ObjectManager
                client={s3Client}
                selectedBucket={selectedBucket}
                currentPath={currentPath}
                onPathChange={handlePathChange}
                onBackToBuckets={handleBackToBuckets}
              />
            ) : (
              <BucketManager
                client={s3Client}
                selectedBucket={selectedBucket}
                onSelectBucket={handleSelectBucket}
              />
            )}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
