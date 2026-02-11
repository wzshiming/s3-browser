import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
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
  FolderOutlined,
  ReloadOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import { S3Client } from '@aws-sdk/client-s3';
import type { BucketInfo } from '../types';
import { listBuckets, createBucket, deleteBucket } from '../services/s3Client';

interface BucketManagerProps {
  client: S3Client | null;
  selectedBucket: string | null;
  onSelectBucket: (bucket: string | null) => void;
  onBackToEndpoints: () => void;
  endpointName: string;
}

const BucketManager: React.FC<BucketManagerProps> = ({
  client,
  selectedBucket,
  onSelectBucket,
  onBackToEndpoints,
  endpointName,
}) => {
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
      message.error(`Failed to list buckets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

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
      message.error(`Failed to create bucket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (bucketName: string) => {
    if (!client) return;
    try {
      await deleteBucket(client, bucketName);
      message.success('Bucket deleted successfully');
      if (selectedBucket === bucketName) {
        onSelectBucket(null);
      }
      fetchBuckets();
    } catch (error) {
      message.error(`Failed to delete bucket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const columns = [
    {
      title: 'Bucket Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <FolderOutlined />
          <a onClick={() => onSelectBucket(name)}>{name}</a>
        </Space>
      ),
    },
    {
      title: 'Creation Date',
      dataIndex: 'creationDate',
      key: 'creationDate',
      responsive: ['md'] as ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')[],
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
      <Card title={`${endpointName} - Buckets`}>
        <p>Connecting to endpoint...</p>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={
          <Space>
            <Button
              icon={<CloudServerOutlined />}
              onClick={onBackToEndpoints}
              type="text"
            />
            {endpointName} - Buckets
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchBuckets}
            >
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={buckets}
          columns={columns}
          rowKey="name"
          loading={loading}
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
          onRow={(record) => ({
            style: {
              backgroundColor: selectedBucket === record.name ? '#e6f7ff' : undefined,
              cursor: 'pointer',
            },
          })}
        />
      </Card>

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
};

export default BucketManager;
