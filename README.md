# S3 Browser

A modern web-based browser for Amazon S3 buckets built with React and TypeScript.

## Features

- 🔐 Secure credential management (credentials stored only in memory)
- 📁 Browse folders and files in S3 buckets
- ⬆️ Upload files to S3
- ⬇️ Download files from S3
- 🗑️ Delete files from S3
- 🧭 Breadcrumb navigation
- 📊 View file sizes and last modified dates
- 💻 Modern, responsive UI

## Prerequisites

- Node.js 18+ and npm
- AWS S3 credentials (Access Key ID and Secret Access Key)
- An S3 bucket to browse

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

1. Start the application
2. Enter your AWS credentials:
   - **Region**: Your AWS region (e.g., `us-east-1`)
   - **Bucket Name**: The name of your S3 bucket
   - **Access Key ID**: Your AWS Access Key ID
   - **Secret Access Key**: Your AWS Secret Access Key
3. Click "Connect"
4. Browse your S3 bucket:
   - Click on folders to navigate into them
   - Use the breadcrumb navigation to go back
   - Upload files using the file input and "Upload File" button
   - Download files by clicking the download icon (⬇️)
   - Delete files by clicking the delete icon (🗑️)

## Security Notes

⚠️ **Important**: 
- Your AWS credentials are stored only in memory and are never sent to any server except AWS S3
- This is a client-side application that connects directly to AWS S3
- For production use, consider using temporary credentials or AWS Cognito for better security
- Never commit your AWS credentials to version control

## Technologies Used

- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vite.dev/) - Build tool
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) - S3 operations

## License

MIT
