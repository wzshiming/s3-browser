// Format file size in human-readable format
export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined) return '-';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// Format date in a readable format
export function formatDate(date: Date | undefined): string {
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Get file extension from key
export function getFileExtension(key: string): string {
  const parts = key.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

// Check if a file is previewable
export function isPreviewable(key: string): boolean {
  const ext = getFileExtension(key);
  const previewableExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp',
    'txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts',
    'pdf',
  ];
  return previewableExtensions.includes(ext);
}

// Check if a file is an image
export function isImage(key: string): boolean {
  const ext = getFileExtension(key);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}

// Check if a file is a text file
export function isTextFile(key: string): boolean {
  const ext = getFileExtension(key);
  return ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'yml', 'yaml', 'log'].includes(ext);
}

// Get file name from full path
export function getFileName(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1] || parts[parts.length - 2] || key;
}

// Get folder path from full key
export function getFolderPath(key: string): string {
  const parts = key.split('/');
  parts.pop();
  return parts.join('/');
}

// Get MIME type from file name
export function getMimeType(fileName: string): string {
  const ext = getFileExtension(fileName);
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'xml': 'application/xml',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'ts': 'text/typescript',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
