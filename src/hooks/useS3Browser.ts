import { useState, useEffect, useCallback } from 'react';
import type { S3Endpoint, Bucket, S3Object, BucketProperties } from '../types';
import { S3Service, loadEndpoints, saveEndpoints, generateEndpointId } from '../services/s3Service';

export function useS3Browser() {
  const [endpoints, setEndpoints] = useState<S3Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<S3Endpoint | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [s3Service, setS3Service] = useState<S3Service | null>(null);

  // Load endpoints from localStorage on mount
  useEffect(() => {
    const storedEndpoints = loadEndpoints();
    setEndpoints(storedEndpoints);
    if (storedEndpoints.length > 0) {
      setSelectedEndpoint(storedEndpoints[0]);
    }
  }, []);

  // Update S3 service when endpoint changes
  useEffect(() => {
    if (selectedEndpoint) {
      setS3Service(new S3Service(selectedEndpoint));
      setBuckets([]);
      setSelectedBucket(null);
      setObjects([]);
      setPrefixes([]);
      setCurrentPath('');
    } else {
      setS3Service(null);
    }
  }, [selectedEndpoint]);

  // Add a new endpoint
  const addEndpoint = useCallback((endpoint: Omit<S3Endpoint, 'id'>) => {
    const newEndpoint = { ...endpoint, id: generateEndpointId() };
    const updatedEndpoints = [...endpoints, newEndpoint];
    setEndpoints(updatedEndpoints);
    saveEndpoints(updatedEndpoints);
    return newEndpoint;
  }, [endpoints]);

  // Update an endpoint
  const updateEndpoint = useCallback((endpoint: S3Endpoint) => {
    const updatedEndpoints = endpoints.map((e) =>
      e.id === endpoint.id ? endpoint : e
    );
    setEndpoints(updatedEndpoints);
    saveEndpoints(updatedEndpoints);
    if (selectedEndpoint?.id === endpoint.id) {
      setSelectedEndpoint(endpoint);
    }
  }, [endpoints, selectedEndpoint]);

  // Delete an endpoint
  const deleteEndpoint = useCallback((endpointId: string) => {
    const updatedEndpoints = endpoints.filter((e) => e.id !== endpointId);
    setEndpoints(updatedEndpoints);
    saveEndpoints(updatedEndpoints);
    if (selectedEndpoint?.id === endpointId) {
      setSelectedEndpoint(updatedEndpoints[0] || null);
    }
  }, [endpoints, selectedEndpoint]);

  // List buckets
  const listBuckets = useCallback(async () => {
    if (!s3Service) return;
    setLoading(true);
    setError(null);
    try {
      const bucketList = await s3Service.listBuckets();
      setBuckets(bucketList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list buckets');
    } finally {
      setLoading(false);
    }
  }, [s3Service]);

  // Create bucket
  const createBucket = useCallback(async (bucketName: string) => {
    if (!s3Service) return;
    setLoading(true);
    setError(null);
    try {
      await s3Service.createBucket(bucketName);
      await listBuckets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bucket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [s3Service, listBuckets]);

  // Delete bucket
  const deleteBucket = useCallback(async (bucketName: string) => {
    if (!s3Service) return;
    setLoading(true);
    setError(null);
    try {
      await s3Service.deleteBucket(bucketName);
      if (selectedBucket?.name === bucketName) {
        setSelectedBucket(null);
        setObjects([]);
        setPrefixes([]);
        setCurrentPath('');
      }
      await listBuckets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bucket');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [s3Service, selectedBucket, listBuckets]);

  // Get bucket properties
  const getBucketProperties = useCallback(async (bucketName: string): Promise<BucketProperties | null> => {
    if (!s3Service) return null;
    try {
      return await s3Service.getBucketProperties(bucketName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get bucket properties');
      return null;
    }
  }, [s3Service]);

  // List objects
  const listObjects = useCallback(async (path: string = '') => {
    if (!s3Service || !selectedBucket) return;
    setLoading(true);
    setError(null);
    try {
      const result = await s3Service.listObjects(selectedBucket.name, path);
      setObjects(result.objects);
      setPrefixes(result.prefixes);
      setCurrentPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list objects');
    } finally {
      setLoading(false);
    }
  }, [s3Service, selectedBucket]);

  // Navigate to path
  const navigateTo = useCallback((path: string) => {
    listObjects(path);
  }, [listObjects]);

  // Navigate up one level
  const navigateUp = useCallback(() => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = parts.length > 0 ? `${parts.join('/')}/` : '';
    navigateTo(parentPath);
  }, [currentPath, navigateTo]);

  // Upload object
  const uploadObject = useCallback(async (file: File, path: string = '') => {
    if (!s3Service || !selectedBucket) return;
    setLoading(true);
    setError(null);
    try {
      const key = path ? `${path}${file.name}` : file.name;
      await s3Service.uploadObject(selectedBucket.name, key, file, file.type);
      await listObjects(currentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload object');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [s3Service, selectedBucket, currentPath, listObjects]);

  // Download object
  const downloadObject = useCallback(async (key: string): Promise<Blob | null> => {
    if (!s3Service || !selectedBucket) return null;
    try {
      return await s3Service.downloadObject(selectedBucket.name, key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download object');
      return null;
    }
  }, [s3Service, selectedBucket]);

  // Delete object
  const deleteObject = useCallback(async (key: string) => {
    if (!s3Service || !selectedBucket) return;
    setLoading(true);
    setError(null);
    try {
      await s3Service.deleteObject(selectedBucket.name, key);
      await listObjects(currentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete object');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [s3Service, selectedBucket, currentPath, listObjects]);

  // Search objects
  const searchObjects = useCallback(async (searchTerm: string): Promise<S3Object[]> => {
    if (!s3Service || !selectedBucket) return [];
    try {
      return await s3Service.searchObjects(selectedBucket.name, searchTerm, currentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search objects');
      return [];
    }
  }, [s3Service, selectedBucket, currentPath]);

  // Create folder
  const createFolder = useCallback(async (folderName: string) => {
    if (!s3Service || !selectedBucket) return;
    setLoading(true);
    setError(null);
    try {
      const folderPath = currentPath ? `${currentPath}${folderName}` : folderName;
      await s3Service.createFolder(selectedBucket.name, folderPath);
      await listObjects(currentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [s3Service, selectedBucket, currentPath, listObjects]);

  // Select bucket and load objects
  const selectBucket = useCallback((bucket: Bucket | null) => {
    setSelectedBucket(bucket);
    setObjects([]);
    setPrefixes([]);
    setCurrentPath('');
    if (bucket && s3Service) {
      setLoading(true);
      setError(null);
      s3Service.listObjects(bucket.name, '').then((result) => {
        setObjects(result.objects);
        setPrefixes(result.prefixes);
      }).catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to list objects');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [s3Service]);

  return {
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
  };
}
