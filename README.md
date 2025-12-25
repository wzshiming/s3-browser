# S3 Browser

A React-based S3 browser supporting bucket and object management. Connect to multiple S3-compatible storage services including AWS S3, MinIO, LocalStack, and others.

## Features

- **Multiple Endpoints**: Securely store and manage multiple S3 endpoint configurations with access keys
- **Bucket Management**: List, create, delete buckets and view bucket properties
- **Object Management**: Upload, download, delete, and preview files
- **Search**: Search for objects within buckets
- **Folder Navigation**: Create folders and navigate through directory structure
- **File Preview**: Preview images and text files directly in the browser
- **Dark/Light Mode**: Automatic theme switching based on system preference

## Tech Stack

- React 19 with TypeScript
- Vite for development and building
- AWS SDK v3 for S3 operations
- Local storage for secure endpoint configuration

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Add an S3 Endpoint**: Click "Add" in the S3 Endpoints section to configure a new S3-compatible storage service
2. **Select a Bucket**: Click on a bucket from the sidebar to browse its contents
3. **Navigate**: Use breadcrumbs or double-click folders to navigate
4. **Upload Files**: Click "Upload" button or drag and drop files
5. **Manage Objects**: Download, preview, or delete files using the action buttons

## Security

- Credentials are stored in the browser's localStorage
- All S3 operations are performed client-side
- No credentials are sent to any third-party servers

## License

MIT
