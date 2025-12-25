import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import type { S3Endpoint, Bucket, S3Object, BucketProperties } from '../types';

export class S3Service {
  private client: S3Client;
  private endpoint: S3Endpoint;

  constructor(endpoint: S3Endpoint) {
    this.endpoint = endpoint;
    this.client = new S3Client({
      endpoint: endpoint.endpoint,
      region: endpoint.region || 'us-east-1',
      credentials: {
        accessKeyId: endpoint.accessKeyId,
        secretAccessKey: endpoint.secretAccessKey,
      },
      forcePathStyle: endpoint.forcePathStyle ?? true,
    });
  }

  async listBuckets(): Promise<Bucket[]> {
    const command = new ListBucketsCommand({});
    const response = await this.client.send(command);
    return (response.Buckets || []).map((bucket) => ({
      name: bucket.Name || '',
      creationDate: bucket.CreationDate,
    }));
  }

  async createBucket(bucketName: string): Promise<void> {
    const command = new CreateBucketCommand({
      Bucket: bucketName,
    });
    await this.client.send(command);
  }

  async deleteBucket(bucketName: string): Promise<void> {
    const command = new DeleteBucketCommand({
      Bucket: bucketName,
    });
    await this.client.send(command);
  }

  async getBucketProperties(bucketName: string): Promise<BucketProperties> {
    // Verify bucket exists
    await this.client.send(new HeadBucketCommand({ Bucket: bucketName }));

    // Get location
    let region: string | undefined;
    try {
      const locationResponse = await this.client.send(
        new GetBucketLocationCommand({ Bucket: bucketName })
      );
      region = locationResponse.LocationConstraint || this.endpoint.region;
    } catch {
      region = this.endpoint.region;
    }

    // Get versioning status
    let versioning = false;
    try {
      const versioningResponse = await this.client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      versioning = versioningResponse.Status === 'Enabled';
    } catch {
      // Versioning info not available
    }

    return {
      name: bucketName,
      region,
      versioning,
    };
  }

  async listObjects(
    bucketName: string,
    prefix: string = '',
    delimiter: string = '/'
  ): Promise<{ objects: S3Object[]; prefixes: string[] }> {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: delimiter,
    });

    const response = await this.client.send(command);

    const objects: S3Object[] = (response.Contents || []).map((obj) => ({
      key: obj.Key || '',
      size: obj.Size,
      lastModified: obj.LastModified,
      etag: obj.ETag,
      storageClass: obj.StorageClass,
      isFolder: false,
    }));

    const prefixes = (response.CommonPrefixes || []).map(
      (p) => p.Prefix || ''
    );

    return { objects, prefixes };
  }

  async uploadObject(
    bucketName: string,
    key: string,
    body: File | Blob | ArrayBuffer,
    contentType?: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body instanceof ArrayBuffer ? new Uint8Array(body) : body,
      ContentType: contentType,
    });
    await this.client.send(command);
  }

  async downloadObject(bucketName: string, key: string): Promise<Blob> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error('Empty response body');
    }

    // Convert stream to blob
    const chunks: BlobPart[] = [];
    const reader = response.Body.transformToWebStream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return new Blob(chunks, { type: response.ContentType });
  }

  async deleteObject(bucketName: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await this.client.send(command);
  }

  async searchObjects(
    bucketName: string,
    searchTerm: string,
    prefix: string = ''
  ): Promise<S3Object[]> {
    const allObjects: S3Object[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await this.client.send(command);

      const matchingObjects = (response.Contents || [])
        .filter((obj) =>
          obj.Key?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((obj) => ({
          key: obj.Key || '',
          size: obj.Size,
          lastModified: obj.LastModified,
          etag: obj.ETag,
          storageClass: obj.StorageClass,
          isFolder: false,
        }));

      allObjects.push(...matchingObjects);
      continuationToken = response.NextContinuationToken;
    } while (continuationToken && allObjects.length < 500);

    return allObjects;
  }

  // Create a folder (empty object with trailing slash)
  async createFolder(bucketName: string, folderPath: string): Promise<void> {
    const key = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: new Uint8Array(0),
    });
    await this.client.send(command);
  }
}

// Endpoint storage management
const STORAGE_KEY = 's3-browser-endpoints';

export function saveEndpoints(endpoints: S3Endpoint[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints));
}

export function loadEndpoints(): S3Endpoint[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function generateEndpointId(): string {
  return `endpoint-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
