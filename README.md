# S3 Browser

A modern web-based browser for S3-compatible storage services built with React and TypeScript. Works with AWS S3, MinIO, DigitalOcean Spaces, and other S3-compatible services.

## Features

- 🔐 Secure credential management (credentials stored only in memory)
- 🪣 **Bucket management** - List, create, and delete buckets
- 🌐 **S3-compatible services** - Support for AWS S3, MinIO, DigitalOcean Spaces, and more via custom endpoints
- 📁 Browse folders and files in S3 buckets
- ⬆️ Upload files to S3
- ⬇️ Download files from S3
- 🗑️ Delete files from S3
- 🧭 Breadcrumb navigation
- 📊 View file sizes and last modified dates
- 🔗 **Shareable URLs** - Full path information in URLs for bookmarking and sharing
- 💻 Modern, responsive UI

## Prerequisites

- Node.js 18+ and npm
- S3 credentials (Access Key ID and Secret Access Key)
  - For AWS S3: AWS credentials
  - For MinIO: MinIO access keys
  - For other S3-compatible services: Service-specific credentials

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

## Usage

### Connecting to AWS S3

1. Start the application
2. Leave **Endpoint** field empty
3. Enter your AWS credentials:
   - **Region**: Your AWS region (e.g., `us-east-1`)
   - **Access Key ID**: Your AWS Access Key ID
   - **Secret Access Key**: Your AWS Secret Access Key
4. Click "Connect"

### Connecting to MinIO or Other S3-Compatible Services

1. Start the application
2. Enter the **Endpoint** URL (e.g., `http://localhost:9000` for local MinIO, or `https://s3.example.com`)
3. Enter your credentials:
   - **Region**: Any valid region name (e.g., `us-east-1`)
   - **Access Key ID**: Your access key
   - **Secret Access Key**: Your secret key
4. Check **Force Path Style** (required for MinIO and some S3-compatible services)
5. Click "Connect"

### Managing Buckets

After connecting, you'll see the bucket management screen:
- **View all buckets**: See a list of all available buckets
- **Create bucket**: Click the "+ Create Bucket" button
- **Delete bucket**: Click the delete icon (🗑️) next to a bucket (bucket must be empty)
- **Browse bucket**: Click on a bucket name or the browse icon (📂)

### Browsing Files

Once in a bucket:
- Click on folders to navigate into them
- Use the breadcrumb navigation to go back
- Use "← Back to Buckets" to return to bucket management
- Upload files using the file input and "Upload File" button
- Download files by clicking the download icon (⬇️)
- Delete files by clicking the delete icon (🗑️)

## Security Notes

⚠️ **Important**: 
- Your credentials are stored only in memory and are never sent to any server except your S3 service
- This is a client-side application that connects directly to your S3 service
- For production use, consider using temporary credentials or identity providers for better security
- Never commit your credentials to version control

## URL Structure

The application uses a URL-based navigation system that allows bookmarking and sharing links to specific locations:

- `/` - Configuration screen (connect to S3)
- `/buckets` - Bucket management screen (list all buckets)
- `/browse/{bucket}` - Browse root of specific bucket
- `/browse/{bucket}/{path}` - Browse specific folder path in bucket

**Examples:**
- `http://localhost:5173/browse/my-bucket` - Browse root of "my-bucket"
- `http://localhost:5173/browse/my-bucket/documents/` - Browse "documents" folder
- `http://localhost:5173/browse/my-bucket/documents/2024/` - Browse nested "2024" folder

**Features:**
- ✅ Shareable URLs - Copy and share links to specific folders
- ✅ Bookmarkable - Save links to frequently accessed locations
- ✅ Browser navigation - Use back/forward buttons to navigate
- ✅ Direct access - Open links directly to specific files/folders

## Technologies Used

- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vite.dev/) - Build tool
- [React Router](https://reactrouter.com/) - URL-based navigation
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) - S3 operations

## License

MIT
