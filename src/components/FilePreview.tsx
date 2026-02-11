import React, { useState } from 'react';
import { Spin, Typography, Image, Alert } from 'antd';
import { S3Client } from '@aws-sdk/client-s3';
import { getObjectAsText, getObjectAsDataUrl } from '../services/s3Client';

const { Text, Paragraph } = Typography;

interface FilePreviewProps {
  client: S3Client | null;
  bucket: string | null;
  objectKey: string;
}

const getFileType = (key: string): 'image' | 'text' | 'video' | 'audio' | 'pdf' | 'unsupported' => {
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];
  const textExts = ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.ts', '.tsx', '.jsx', '.yaml', '.yml', '.log', '.csv', '.ini', '.conf', '.sh', '.bash', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h', '.hpp'];
  const videoExts = ['.mp4', '.webm', '.ogg'];
  const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac'];
  const pdfExts = ['.pdf'];

  const lowerKey = key.toLowerCase();
  const hasSuffix = (exts: string[]) => exts.some(e => lowerKey.endsWith(e));

  if (hasSuffix(imageExts)) return 'image';
  if (hasSuffix(textExts)) return 'text';
  if (hasSuffix(videoExts)) return 'video';
  if (hasSuffix(audioExts)) return 'audio';
  if (hasSuffix(pdfExts)) return 'pdf';

  return 'unsupported';
};

const FilePreview: React.FC<FilePreviewProps> = ({
  client,
  bucket,
  objectKey,
}) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>('');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fileType = getFileType(objectKey);
  const fileName = objectKey.split('/').pop() || objectKey;

  React.useEffect(() => {
    if (!client || !bucket || !objectKey) {
      return;
    }

    const loadContent = async () => {
      setLoading(true);
      setError('');
      setContent('');
      setDataUrl('');

      try {
        if (fileType === 'text') {
          const result = await getObjectAsText(client, bucket, objectKey);
          setContent(result.content);
        } else if (fileType === 'image' || fileType === 'video' || fileType === 'audio' || fileType === 'pdf') {
          const url = await getObjectAsDataUrl(client, bucket, objectKey);
          setDataUrl(url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [client, bucket, objectKey, fileType]);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading preview...</div>
        </div>
      );
    }

    if (error) {
      return <Alert type="error" message="Error" description={error} />;
    }

    switch (fileType) {
      case 'image':
        return (
          <div style={{ textAlign: 'center' }}>
            <Image src={dataUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
          </div>
        );

      case 'text':
        return (
          <div
            style={{ overflow: 'auto' }}
          >
            <Paragraph>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                <Text code>{content}</Text>
              </pre>
            </Paragraph>
          </div>
        );

      case 'video':
        return (
          <div style={{ textAlign: 'center' }}>
            <video controls style={{ maxWidth: '100%', maxHeight: '70vh' }} src={dataUrl}>
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <audio controls src={dataUrl}>
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      case 'pdf':
        return (
          <div style={{ overflow: 'auto' }}>
            <iframe src={dataUrl} width="100%" height="100%" title={fileName} />
          </div>
        );

      default:
        return (
          <Alert
            type="info"
            description="This file type cannot be previewed. Please download the file to view it."
          />
        );
    }
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
};

export default FilePreview;
