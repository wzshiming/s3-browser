// S3 Endpoint configuration
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
export interface BucketInfo {
  name: string;
  creationDate?: Date;
}

// Object information
export interface ObjectInfo {
  key: string;
  size: number;
  lastModified?: Date;
  isFolder: boolean;
}

// Object properties
export interface ObjectProperties {
  key: string;
  size: number;
  lastModified?: Date;
  contentType?: string;
}

// Extend React's input element attributes to include webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
