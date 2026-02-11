import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { S3Client } from '@aws-sdk/client-s3';
import type { BucketInfo } from '../types';
import { listBuckets, createBucket, deleteBucket } from '../services/s3Client';
import { getErrorMessage } from '../utils/error';

export interface BucketManagerHandle {
  reload: () => void;
  openCreateModal: () => void;
}

export const BucketManagerToolbar: React.FC<{ managerRef: React.RefObject<BucketManagerHandle | null> }> = ({ managerRef }) => {
  return (
    <Space>
      <Button
        icon={<ReloadOutlined />}
        onClick={() => managerRef.current?.reload()}
      >
      </Button>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => managerRef.current?.openCreateModal()}
      >
      </Button>
    </Space>
  );
};

interface BucketManagerProps {
  client: S3Client | null;
  onSelectBucket: (bucket: string) => void;
}

const BucketManager = forwardRef<BucketManagerHandle, BucketManagerProps>(({
  client,
  onSelectBucket,
}, ref) => {
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchBuckets = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const list = await listBuckets(client);
      setBuckets(list);
    } catch (error) {
      message.error(`Failed to list buckets: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  useImperativeHandle(ref, () => ({
    reload: fetchBuckets,
    openCreateModal: () => setCreateModalVisible(true),
  }), [fetchBuckets]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (!client) return;

      await createBucket(client, values.bucketName);
      message.success('Bucket created successfully');
      setCreateModalVisible(false);
      form.resetFields();
      fetchBuckets();
    } catch (error) {
      message.error(`Failed to create bucket: ${getErrorMessage(error)}`);
    }
  };

  const handleDelete = async (bucketName: string) => {
    if (!client) return;
    try {
      await deleteBucket(client, bucketName);
      message.success('Bucket deleted successfully');
      fetchBuckets();
    } catch (error) {
      message.error(`Failed to delete bucket: ${getErrorMessage(error)}`);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <InboxOutlined />
          {name}
          {'/'}
        </Space>
      ),
    },
    {
      title: 'Creation Date',
      dataIndex: 'creationDate',
      key: 'creationDate',
      render: (date: Date) => date?.toLocaleString() || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 30,
      render: (_: unknown, record: BucketInfo) =>
        <Space>
          <Popconfirm
            title="Delete this bucket?"
            onConfirm={() => handleDelete(record.name)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
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
      <Table
        dataSource={buckets}
        columns={columns}
        rowKey="name"
        loading={loading}
        size="small"
        pagination={
          {
            defaultPageSize: 10,
            showSizeChanger: true,
          }
        }
        scroll={{ x: 'max-content' }}
        onRow={(record) => ({
          onClick: (event) => {
            const target = event.target as HTMLElement;
            if (target.closest('button')) return;
            onSelectBucket(record.name);
          },
        })}
      />

      <Modal
        title="Create Bucket"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="bucketName"
            label="Bucket Name"
            rules={[
              { required: true, message: 'Please enter bucket name' },
              {
                pattern: /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/,
                message: 'Invalid bucket name format',
              },
            ]}
          >
            <Input placeholder="my-bucket-name" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
});

BucketManager.displayName = 'BucketManager';

export default BucketManager;
