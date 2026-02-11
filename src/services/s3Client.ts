import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FetchHttpHandler } from '@smithy/fetch-http-handler';
import type { S3Endpoint, BucketInfo, ObjectInfo, ObjectProperties } from '../types';

export const createS3Client = (endpoint: S3Endpoint): S3Client => {
  return new S3Client({
    endpoint: endpoint.endpoint,
    region: endpoint.region || 'us-east-1',
    credentials: {
      accessKeyId: endpoint.accessKeyId,
      secretAccessKey: endpoint.secretAccessKey,
    },
    forcePathStyle: endpoint.forcePathStyle ?? true,
    // Use fetch-based HTTP handler for browser compatibility
    requestHandler: new FetchHttpHandler(),
  });
};

export const listBuckets = async (client: S3Client): Promise<BucketInfo[]> => {
  const response = await client.send(new ListBucketsCommand({}));
  return (response.Buckets || []).map(bucket => ({
    name: bucket.Name || '',
    creationDate: bucket.CreationDate,
  }));
};

export const createBucket = async (client: S3Client, bucketName: string): Promise<void> => {
  await client.send(new CreateBucketCommand({ Bucket: bucketName }));
};

export const deleteBucket = async (client: S3Client, bucketName: string): Promise<void> => {
  await client.send(new DeleteBucketCommand({ Bucket: bucketName }));
};

export const listObjects = async (
  client: S3Client,
  bucketName: string,
  prefix: string = '',
  continuationToken?: string
): Promise<{ objects: ObjectInfo[]; nextToken?: string; prefixes: string[] }> => {
  const response = await client.send(new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    Delimiter: '/',
    ContinuationToken: continuationToken,
    MaxKeys: 1000,
  }));

  const objects: ObjectInfo[] = (response.Contents || [])
    .filter(obj => obj.Key !== prefix) // Filter out the prefix itself
    .map(obj => ({
      key: obj.Key || '',
      size: obj.Size || 0,
      lastModified: obj.LastModified,
      isFolder: false,
    }));

  const prefixes = (response.CommonPrefixes || []).map(p => p.Prefix || '');

  // Add folder entries
  const folders: ObjectInfo[] = prefixes.map(p => ({
    key: p,
    size: 0,
    lastModified: new Date(),
    isFolder: true,
  }));

  return {
    objects: [...folders, ...objects],
    nextToken: response.NextContinuationToken,
    prefixes,
  };
};

export const uploadObject = async (
  client: S3Client,
  bucketName: string,
  key: string,
  body: File,
): Promise<void> => {
  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: await body.arrayBuffer(),
    ContentType: body.type || 'application/octet-stream',
  }));
};

export const deleteObject = async (
  client: S3Client,
  bucketName: string,
  key: string
): Promise<void> => {
  await client.send(new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  }));
};

export const deleteObjects = async (
  client: S3Client,
  bucketName: string,
  keys: string[]
): Promise<void> => {
  if (keys.length === 0) return;

  await client.send(new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: {
      Objects: keys.map(key => ({ Key: key })),
      Quiet: true,
    },
  }));
};

export const getObjectProperties = async (
  client: S3Client,
  bucketName: string,
  key: string
): Promise<ObjectProperties> => {
  const response = await client.send(new HeadObjectCommand({
    Bucket: bucketName,
    Key: key,
  }));

  return {
    key,
    size: response.ContentLength || 0,
    lastModified: response.LastModified,
    contentType: response.ContentType,
  };
};

export const downloadObject = async (
  client: S3Client,
  bucketName: string,
  key: string
): Promise<Blob> => {
  const response = await client.send(new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  }));

  if (!response.Body) {
    throw new Error('No content received');
  }

  // Convert the stream to blob
  const bytes = await response.Body.transformToByteArray();
  return new Blob([bytes], { type: response.ContentType });
};

export const getObjectAsText = async (
  client: S3Client,
  bucketName: string,
  key: string
): Promise<{ content: string; contentType: string }> => {
  const response = await client.send(new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  }));

  if (!response.Body) {
    throw new Error('No content received');
  }

  const text = await response.Body.transformToString();
  return {
    content: text,
    contentType: response.ContentType || 'text/plain',
  };
};

export const getPresignedUrl = async (
  client: S3Client,
  bucketName: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
};
