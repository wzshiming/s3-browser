# S3 Browser

A web-based S3 browser application built with React, TypeScript, and Vite. It allows you to manage multiple S3-compatible endpoints and browse/manage buckets and objects.

## Features

- **Endpoint Management**: Store multiple S3 endpoints with credentials securely in localStorage
- **Bucket Management**: List, create, delete, and view bucket properties
- **Object Management**: Upload files/folders, download, delete, view properties, and preview
- **URL Anchors**: Navigate using URL hash for current bucket/object path

## Tech Stack

- React 19 + TypeScript
- Vite for build tooling
- AWS SDK for JavaScript v3 (S3 Client)
- Ant Design UI Components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Add an S3 Endpoint**: Click "Add" in the S3 Endpoints panel to configure your S3-compatible storage (AWS S3, MinIO, etc.)
2. **Select an Endpoint**: Click on an endpoint to connect
3. **Browse Buckets**: View, create, or delete buckets
4. **Browse Objects**: Click on a bucket to browse its contents
5. **Upload Files**: Use "Upload Files" or "Upload Folder" buttons
6. **Manage Objects**: Download, preview, or delete objects

## Supported S3 Providers

- Amazon S3
- MinIO
- Any S3-compatible storage service

## Security

Credentials are stored in the browser's localStorage with base64 encoding. While this provides basic obfuscation, it is not cryptographically secure. Use caution when storing sensitive credentials.
