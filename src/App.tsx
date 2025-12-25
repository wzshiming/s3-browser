import { useCallback } from 'react';
import { useS3Browser } from './hooks/useS3Browser';
import { Sidebar } from './components/Sidebar';
import { ObjectBrowser } from './components/ObjectBrowser';
import './App.css';

function App() {
  const {
    // Endpoints
    endpoints,
    selectedEndpoint,
    setSelectedEndpoint,
    addEndpoint,
    updateEndpoint,
    deleteEndpoint,
    
    // Buckets
    buckets,
    selectedBucket,
    selectBucket,
    listBuckets,
    createBucket,
    deleteBucket,
    getBucketProperties,
    
    // Objects
    objects,
    prefixes,
    currentPath,
    listObjects,
    navigateTo,
    navigateUp,
    uploadObject,
    downloadObject,
    deleteObject,
    searchObjects,
    createFolder,
    
    // State
    loading,
    error,
    setError,
  } = useS3Browser();

  const handleRefreshObjects = useCallback(() => {
    listObjects(currentPath);
  }, [listObjects, currentPath]);

  return (
    <div className="app">
      <Sidebar
        endpoints={endpoints}
        selectedEndpoint={selectedEndpoint}
        buckets={buckets}
        selectedBucket={selectedBucket}
        loading={loading}
        onEndpointSelect={setSelectedEndpoint}
        onEndpointAdd={addEndpoint}
        onEndpointUpdate={updateEndpoint}
        onEndpointDelete={deleteEndpoint}
        onBucketSelect={selectBucket}
        onBucketRefresh={listBuckets}
        onBucketCreate={createBucket}
        onBucketDelete={deleteBucket}
        onBucketGetProperties={getBucketProperties}
      />
      
      <main className="main-content">
        <ObjectBrowser
          bucket={selectedBucket}
          objects={objects}
          prefixes={prefixes}
          currentPath={currentPath}
          loading={loading}
          onNavigateTo={navigateTo}
          onNavigateUp={navigateUp}
          onUpload={uploadObject}
          onDownload={downloadObject}
          onDelete={deleteObject}
          onSearch={searchObjects}
          onCreateFolder={createFolder}
          onRefresh={handleRefreshObjects}
        />
      </main>

      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          <span className="error-icon">⚠</span>
          <span className="error-message">{error}</span>
          <button className="error-close">✕</button>
        </div>
      )}
    </div>
  );
}

export default App;
