// S3 Endpoint configuration stored locally
export interface S3Endpoint {
  id: string;
  name: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

// Bucket information
export interface Bucket {
  name: string;
  creationDate?: Date;
}

// S3 Object information
export interface S3Object {
  key: string;
  size?: number;
  lastModified?: Date;
  etag?: string;
  storageClass?: string;
  isFolder?: boolean;
}

// Bucket properties
export interface BucketProperties {
  name: string;
  creationDate?: Date;
  region?: string;
  versioning?: boolean;
  objectCount?: number;
}

// Application state
export interface AppState {
  endpoints: S3Endpoint[];
  selectedEndpoint: S3Endpoint | null;
  selectedBucket: Bucket | null;
  currentPath: string;
}
