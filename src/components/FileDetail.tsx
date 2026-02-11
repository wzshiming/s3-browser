import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Space,
  Descriptions,
  Spin,
  Popconfirm,
  message,
  Divider,
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { S3Client } from '@aws-sdk/client-s3';
import type { ObjectProperties } from '../types';
import {
  getObjectProperties,
  deleteObjects,
  getPresignedUrl,
  downloadObject,
} from '../services/s3Client';
import { formatSize } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import { downloadBlob, copyToClipboard } from '../utils/download';
import FilePreview from './FilePreview';

interface FileDetailProps {
  client: S3Client | null;
  bucketName: string;
  filePath: string;
  onPathChange: (path: string) => void;
  setExtra: (extra: React.ReactNode) => void;
}

const FileDetail: React.FC<FileDetailProps> = ({
  client,
  bucketName,
  filePath,
  onPathChange,
  setExtra,
}) => {
  const [properties, setProperties] = useState<ObjectProperties | null>(null);
  const [loading, setLoading] = useState(false);

  const fileName = filePath.split('/').pop() || filePath;
  const parentPath = filePath.substring(0, filePath.lastIndexOf('/') + 1);

  const fetchProperties = useCallback(async () => {
    if (!client || !bucketName || !filePath) return;
    setLoading(true);
    try {
      const props = await getObjectProperties(client, bucketName, filePath);
      setProperties(props);
    } catch (error) {
      message.error(`Failed to get properties: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, [client, bucketName, filePath]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    setExtra(null);
    return () => setExtra(null);
  }, [setExtra]);

  const handleDownload = async () => {
    if (!client || !bucketName) return;
    try {
      const blob = await downloadObject(client, bucketName, filePath);
      downloadBlob(blob, fileName);
    } catch (error) {
      message.error(`Failed to download: ${getErrorMessage(error)}`);
    }
  };

  const handleCopyLink = async () => {
    if (!client || !bucketName) return;
    try {
      const url = await getPresignedUrl(client, bucketName, filePath);
      await copyToClipboard(url);
      message.success('Download link copied to clipboard');
    } catch (error) {
      message.error(`Failed to copy link: ${getErrorMessage(error)}`);
    }
  };

  const handleDelete = async () => {
    if (!client || !bucketName) return;
    try {
      await deleteObjects(client, bucketName, [filePath]);
      message.success(`Deleted ${fileName}`);
      onPathChange(parentPath);
    } catch (error) {
      message.error(`Failed to delete: ${getErrorMessage(error)}`);
    }
  };

  if (!client) {
    return (
      <p>Please select an endpoint first.</p>
    );
  }

  return (
    <>
      {loading ? (
        <Spin />
      ) : properties ? (
        <>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Key">{properties.key}</Descriptions.Item>
            <Descriptions.Item label="Size">
              {formatSize(properties.size)}
            </Descriptions.Item>
            <Descriptions.Item label="Last Modified">
              {properties.lastModified?.toLocaleString() || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Content Type">
              {properties.contentType || '-'}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              Download
            </Button>
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyLink}
            >
              Copy Link
            </Button>
            <Popconfirm
              title={`Delete ${fileName}?`}
              onConfirm={handleDelete}
            >
              <Button icon={<DeleteOutlined />} danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>

          <Divider />

          <FilePreview
            client={client}
            bucket={bucketName}
            objectKey={filePath}
          />
        </>
      ) : null}
    </>
  );
};

export default FileDetail;
