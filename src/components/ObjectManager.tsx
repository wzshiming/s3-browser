import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Upload,
  Popconfirm,
  message,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  FolderAddOutlined,
  DeleteOutlined,
  DownloadOutlined,
  CopyOutlined,
  FolderOutlined,
  FileOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import { S3Client } from '@aws-sdk/client-s3';
import type { ObjectInfo } from '../types';
import {
  listObjects,
  uploadObject,
  deleteObjects,
  getPresignedUrl,
  downloadObject,
} from '../services/s3Client';
import { formatSize } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import { downloadBlob, copyToClipboard } from '../utils/download';
import NavigationBar from './NavigationBar';

interface ObjectManagerProps {
  client: S3Client | null;
  endpointName: string;
  bucketName: string;
  currentPath: string;
  onPathChange: (path: string) => void;
  onBackToBuckets: () => void;
  onBackToEndpoints: () => void;
}

const ObjectManager: React.FC<ObjectManagerProps> = ({
  client,
  endpointName,
  bucketName,
  currentPath,
  onPathChange,
  onBackToBuckets,
  onBackToEndpoints,
}) => {
  const [objects, setObjects] = useState<ObjectInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const fetchObjects = useCallback(async () => {
    if (!client || !bucketName) return;
    setLoading(true);
    try {
      const result = await listObjects(client, bucketName, currentPath);
      setObjects(result.objects);
    } catch (error) {
      message.error(`Failed to list objects: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, [client, bucketName, currentPath]);

  useEffect(() => {
    fetchObjects();
    setSelectedRowKeys([]);
  }, [fetchObjects]);

  const handleUpload = async (file: RcFile): Promise<boolean> => {
    if (!client || !bucketName) return false;

    setUploading(true);
    setUploadProgress(0);

    try {
      const key = currentPath + file.name;
      await uploadObject(client, bucketName, key, file);
      message.success(`Uploaded ${file.name}`);
      fetchObjects();
    } catch (error) {
      message.error(`Failed to upload: ${getErrorMessage(error)}`);
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }

    return false; // Prevent default upload behavior
  };

  const handleUploadFolder = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !client || !bucketName) return;

    setUploading(true);
    const total = files.length;
    let completed = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = file.webkitRelativePath || file.name;
        const key = currentPath + relativePath;

        await uploadObject(client, bucketName, key, file);
        completed++;
        setUploadProgress(Math.round((completed / total) * 100));
      }
      message.success(`Uploaded ${total} files`);
      fetchObjects();
    } catch (error) {
      message.error(`Failed to upload folder: ${getErrorMessage(error)}`);
    } finally {
      setUploading(false);
      // Reset the input
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };

  const handleBatchDelete = async () => {
    if (!client || !bucketName || selectedRowKeys.length === 0) return;
    try {
      await deleteObjects(client, bucketName, selectedRowKeys as string[]);
      message.success(`Deleted ${selectedRowKeys.length} items`);
      setSelectedRowKeys([]);
      fetchObjects();
    } catch (error) {
      message.error(`Failed to delete: ${getErrorMessage(error)}`);
    }
  };

  const handleDownload = async (key: string) => {
    if (!client || !bucketName) return;
    try {
      const blob = await downloadObject(client, bucketName, key);
      downloadBlob(blob, key.split('/').pop() || 'download');
    } catch (error) {
      message.error(`Failed to download: ${getErrorMessage(error)}`);
    }
  };

  const handleCopyLink = async (key: string) => {
    if (!client || !bucketName) return;
    try {
      const url = await getPresignedUrl(client, bucketName, key);
      await copyToClipboard(url);
      message.success('Download link copied to clipboard');
    } catch (error) {
      message.error(`Failed to copy link: ${getErrorMessage(error)}`);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'key',
      key: 'key',
      render: (key: string, record: ObjectInfo) => {
        const name = key.split('/').filter(Boolean).pop() || key;
        return (
          <Space>
            {record.isFolder ? <FolderOutlined /> : <FileOutlined />}
            {name}
            {record.isFolder ? '/' : ''}
          </Space>
        );
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number, record: ObjectInfo) =>
        record.isFolder ? '-' : formatSize(size),
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 180,
      render: (date: Date, record: ObjectInfo) =>
        record.isFolder ? '-' : date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: ObjectInfo) =>
        <Space>
          {!record.isFolder && (
            <>
              <Button
                icon={<DownloadOutlined />}
                size="small"
                onClick={() => handleDownload(record.key)}
                title="Download"
              />
              <Button
                icon={<CopyOutlined />}
                size="small"
                onClick={() => handleCopyLink(record.key)}
                title="Copy Link"
              />
            </>
          )}
        </Space>
    },
  ];

  if (!client) {
    return (
      <Card title="Objects">
        <p>Please select an endpoint first.</p>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={
          <NavigationBar
            endpointName={endpointName}
            bucketName={bucketName || undefined}
            path={currentPath || undefined}
            onNavigateEndpoints={onBackToEndpoints}
            onNavigateBuckets={onBackToBuckets}
            onNavigatePath={onPathChange}
          />
        }
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={fetchObjects}>
            </Button>
            <Upload
              beforeUpload={handleUpload}
              showUploadList={false}
              multiple
            >
              <Button icon={<PlusOutlined />}></Button>
            </Upload>
            <Button
              icon={<FolderAddOutlined />}
              onClick={() => folderInputRef.current?.click()}
            >
            </Button>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`Delete ${selectedRowKeys.length} items?`}
                onConfirm={handleBatchDelete}
              >
                <Button icon={<DeleteOutlined />} danger></Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        <input
          type="file"
          ref={folderInputRef}
          style={{ display: 'none' }}
          webkitdirectory=""
          directory=""
          onChange={handleUploadFolder}
        />
        {uploading && (
          <Progress
            percent={uploadProgress}
            status="active"
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          dataSource={objects}
          columns={columns}
          rowKey="key"
          loading={loading}
          size="small"
          pagination={
            {
              defaultPageSize: 10,
              showSizeChanger: true,
            }
          }
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record: ObjectInfo) => ({
              disabled: record.isFolder, // hide/disable checkbox for folders
            }),
          }}
          onRow={(record) => ({
            onClick: (event) => {
              const target = event.target as HTMLElement;
              if (target.closest('button')) return;
              onPathChange(record.key);
            },
          })}
        />
      </Card>
    </>
  );
};

export default ObjectManager;
