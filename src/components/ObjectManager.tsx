import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  Table,
  Button,
  Space,
  Upload,
  Popconfirm,
  message,
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

export interface ObjectManagerHandle {
  reload: () => void;
  upload: (file: RcFile) => Promise<boolean>;
  openFolderUpload: () => void;
  getSelectedCount: () => number;
  batchDelete: () => void;
}

export const ObjectManagerToolbar: React.FC<{
  managerRef: React.RefObject<ObjectManagerHandle | null>;
  selectedCount: number;
}> = ({ managerRef, selectedCount }) => {
  return (
    <Space wrap>
      <Button icon={<ReloadOutlined />} onClick={() => managerRef.current?.reload()}>
      </Button>
      <Upload
        beforeUpload={(file) => managerRef.current?.upload(file as RcFile) ?? false}
        showUploadList={false}
        multiple
      >
        <Button icon={<PlusOutlined />}></Button>
      </Upload>
      <Button
        icon={<FolderAddOutlined />}
        onClick={() => managerRef.current?.openFolderUpload()}
      >
      </Button>
      {selectedCount > 0 && (
        <Popconfirm
          title={`Delete ${selectedCount} items?`}
          onConfirm={() => managerRef.current?.batchDelete()}
        >
          <Button icon={<DeleteOutlined />} danger></Button>
        </Popconfirm>
      )}
    </Space>
  );
};

interface ObjectManagerProps {
  client: S3Client | null;
  bucketName: string;
  currentPath: string;
  onPathChange: (path: string) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  onSelectionChange?: (count: number) => void;
}

const ObjectManager = forwardRef<ObjectManagerHandle, ObjectManagerProps>(({
  client,
  bucketName,
  currentPath,
  onPathChange,
  setUploading,
  setUploadProgress,
  onSelectionChange,
}, ref) => {
  const [objects, setObjects] = useState<ObjectInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
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

  const handleUpload = useCallback(async (file: RcFile): Promise<boolean> => {
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
  }, [client, bucketName, currentPath, fetchObjects, setUploading, setUploadProgress]);

  const handleBatchDelete = useCallback(async () => {
    if (!client || !bucketName || selectedRowKeys.length === 0) return;
    try {
      await deleteObjects(client, bucketName, selectedRowKeys as string[]);
      message.success(`Deleted ${selectedRowKeys.length} items`);
      setSelectedRowKeys([]);
      fetchObjects();
    } catch (error) {
      message.error(`Failed to delete: ${getErrorMessage(error)}`);
    }
  }, [client, bucketName, selectedRowKeys, fetchObjects]);

  useImperativeHandle(ref, () => ({
    reload: fetchObjects,
    upload: handleUpload,
    openFolderUpload: () => folderInputRef.current?.click(),
    getSelectedCount: () => selectedRowKeys.length,
    batchDelete: handleBatchDelete,
  }), [fetchObjects, handleUpload, handleBatchDelete, selectedRowKeys]);

  useEffect(() => {
    onSelectionChange?.(selectedRowKeys.length);
  }, [selectedRowKeys, onSelectionChange]);

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
      <p>Please select an endpoint first.</p>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={folderInputRef}
        style={{ display: 'none' }}
        webkitdirectory=""
        directory=""
        onChange={handleUploadFolder}
      />
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
    </>
  );
});

export default ObjectManager;
