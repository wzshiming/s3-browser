import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Breadcrumb,
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
  FolderOutlined,
  FileOutlined,
  HomeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import { S3Client } from '@aws-sdk/client-s3';
import type { ObjectInfo } from '../types';
import {
  listObjects,
  uploadObject,
  deleteObjects,
  downloadObject,
} from '../services/s3Client';

interface ObjectManagerProps {
  client: S3Client | null;
  selectedBucket: string | null;
  currentPath: string;
  onPathChange: (path: string) => void;
  onBackToBuckets: () => void;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
};

const ObjectManager: React.FC<ObjectManagerProps> = ({
  client,
  selectedBucket,
  currentPath,
  onPathChange,
  onBackToBuckets,
}) => {
  const [objects, setObjects] = useState<ObjectInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const fetchObjects = useCallback(async () => {
    if (!client || !selectedBucket) return;
    setLoading(true);
    try {
      const result = await listObjects(client, selectedBucket, currentPath);
      setObjects(result.objects);
    } catch (error) {
      message.error(`Failed to list objects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [client, selectedBucket, currentPath]);

  useEffect(() => {
    fetchObjects();
    setSelectedRowKeys([]);
  }, [fetchObjects]);

  const handleNavigate = (key: string) => {
    onPathChange(key);
  };

  const getBreadcrumbItems = () => {
    const items: Array<{ key: string; title: React.ReactNode }> = [
      {
        key: 'bucket',
        title:
          currentPath ? (
            <a onClick={() => onPathChange('')}>{selectedBucket}</a>
          ) : (
            <span>{selectedBucket}</span>
          ),
      },
    ];

    if (currentPath) {
      const parts = currentPath.split('/').filter(Boolean);
      let accPath = '';
      parts.forEach((part, index) => {
        accPath += part + '/';
        const pathCopy = accPath;
        items.push({
          key: pathCopy,
          title:
            index === parts.length - 1 ? (
              <span>{part}</span>
            ) : (
              <a onClick={() => onPathChange(pathCopy)}>{part}</a>
            ),
        });
      });
      items.push({ key: '', title: <span></span> });
    }

    return items;
  };

  const handleUpload = async (file: RcFile): Promise<boolean> => {
    if (!client || !selectedBucket) return false;

    setUploading(true);
    setUploadProgress(0);

    try {
      const key = currentPath + file.name;
      await uploadObject(client, selectedBucket, key, file, file.type);
      message.success(`Uploaded ${file.name}`);
      fetchObjects();
    } catch (error) {
      message.error(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }

    return false; // Prevent default upload behavior
  };

  const handleUploadFolder = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !client || !selectedBucket) return;

    setUploading(true);
    const total = files.length;
    let completed = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = file.webkitRelativePath || file.name;
        const key = currentPath + relativePath;

        await uploadObject(client, selectedBucket, key, file, file.type);
        completed++;
        setUploadProgress(Math.round((completed / total) * 100));
      }
      message.success(`Uploaded ${total} files`);
      fetchObjects();
    } catch (error) {
      message.error(`Failed to upload folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      // Reset the input
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };

  const handleBatchDelete = async () => {
    if (!client || !selectedBucket || selectedRowKeys.length === 0) return;
    try {
      await deleteObjects(client, selectedBucket, selectedRowKeys as string[]);
      message.success(`Deleted ${selectedRowKeys.length} items`);
      setSelectedRowKeys([]);
      fetchObjects();
    } catch (error) {
      message.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownload = async (key: string) => {
    if (!client || !selectedBucket) return;
    try {
      const blob = await downloadObject(client, selectedBucket, key);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = key.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      message.error(`Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'key',
      key: 'key',
      render: (key: string, record: ObjectInfo) => {
        const name = (() => {
          const trimmed = key.endsWith('/') ? key.slice(0, -1) : key;
          return trimmed.substring(trimmed.lastIndexOf('/') + 1);
        })();
        return (
          <Space>
            {record.isFolder ? <FolderOutlined /> : <FileOutlined />}
            <a onClick={() => handleNavigate(key)}>{name}</a>
          </Space>
        );
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      responsive: ['md'] as ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')[],
      render: (size: number, record: ObjectInfo) =>
        record.isFolder ? '' : formatSize(size),
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 180,
      responsive: ['lg'] as ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')[],
      render: (date: Date, record: ObjectInfo) =>
        record.isFolder ? '' : date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 50,
      render: (_: unknown, record: ObjectInfo) =>

        <Space>
          {!record.isFolder && (
            <Button
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleDownload(record.key)}
              title="Download"
            />
          )}
        </Space>
    },
  ];

  if (!client) {
    return (
      <Card title="Objects">
        <p>Please select a bucket first.</p>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={
          <Space wrap>
            <Button
              icon={<HomeOutlined />}
              onClick={onBackToBuckets}
              type="text"
            />
            <Breadcrumb items={getBreadcrumbItems()} />
          </Space>
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
          pagination={{ pageSize: 50 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record: ObjectInfo) => ({
              disabled: record.isFolder, // hide/disable checkbox for folders
            }),
          }}
        />
      </Card>
    </>
  );
};

export default ObjectManager;
