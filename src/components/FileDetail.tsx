import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
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
} from '@ant-design/icons';
import { S3Client } from '@aws-sdk/client-s3';
import type { ObjectProperties } from '../types';
import {
  getObjectProperties,
  downloadObject,
  deleteObjects,
} from '../services/s3Client';
import FilePreview from './FilePreview';
import NavigationBar from './NavigationBar';

interface FileDetailProps {
  client: S3Client | null;
  selectedBucket: string | null;
  filePath: string;
  onPathChange: (path: string) => void;
  onBackToBuckets: () => void;
  endpointName: string;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
};

const FileDetail: React.FC<FileDetailProps> = ({
  client,
  selectedBucket,
  filePath,
  onPathChange,
  onBackToBuckets,
  endpointName,
}) => {
  const [properties, setProperties] = useState<ObjectProperties | null>(null);
  const [loading, setLoading] = useState(false);

  const fileName = filePath.split('/').pop() || filePath;
  const parentPath = filePath.substring(0, filePath.lastIndexOf('/') + 1);

  const fetchProperties = useCallback(async () => {
    if (!client || !selectedBucket || !filePath) return;
    setLoading(true);
    try {
      const props = await getObjectProperties(client, selectedBucket, filePath);
      setProperties(props);
    } catch (error) {
      message.error(`Failed to get properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [client, selectedBucket, filePath]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDownload = async () => {
    if (!client || !selectedBucket) return;
    try {
      const blob = await downloadObject(client, selectedBucket, filePath);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      message.error(`Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    if (!client || !selectedBucket) return;
    try {
      await deleteObjects(client, selectedBucket, [filePath]);
      message.success(`Deleted ${fileName}`);
      onPathChange(parentPath);
    } catch (error) {
      message.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!client) {
    return (
      <Card title="File Details">
        <p>Please select a bucket first.</p>
      </Card>
    );
  }

  return (
    <Card
      title={
        <NavigationBar
          endpointName={endpointName}
          bucketName={selectedBucket || undefined}
          path={filePath || undefined}
          onNavigateEndpoints={undefined}
          onNavigateBuckets={onBackToBuckets}
          onNavigatePath={onPathChange}
        />
      }
    >
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
            bucket={selectedBucket}
            objectKey={filePath}
          />
        </>
      ) : null}
    </Card>
  );
};

export default FileDetail;
