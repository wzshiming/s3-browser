import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Table,
  Card,
  Space,
  Popconfirm,
  Switch,
  message,
  theme,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import type { S3Endpoint } from '../types';
import {
  loadEndpoints,
  addEndpoint,
  updateEndpoint,
  deleteEndpoint,
} from '../services/storage';
import NavigationBar from './NavigationBar';

interface EndpointManagerProps {
  selectedEndpoint: string;
  onSelectEndpoint: (endpoint: string) => void;
}

const EndpointManager: React.FC<EndpointManagerProps> = ({
  selectedEndpoint,
  onSelectEndpoint,
}) => {

  const { token } = theme.useToken();
  const [editingEndpoint, setEditingEndpoint] = useState<S3Endpoint | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingEndpoint(null);
    form.resetFields();
    form.setFieldsValue({ forcePathStyle: true, region: 'us-east-1' });
    setModalVisible(true);
  };

  const handleEdit = (endpoint: S3Endpoint) => {
    setEditingEndpoint(endpoint);
    form.setFieldsValue(endpoint);
    setModalVisible(true);
  };

  const handleDelete = (name: string) => {
    deleteEndpoint(name);
    message.success('Endpoint deleted');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingEndpoint) {
        const updated = { ...editingEndpoint, ...values };
        updateEndpoint(updated);
        if (selectedEndpoint === updated.name) {
          onSelectEndpoint(updated.name);
        }
        message.success('Endpoint updated');
      } else {
        addEndpoint(values);
        message.success('Endpoint added');
      }
      setModalVisible(false);
      form.resetFields();
    } catch {
      // Validation failed
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingEndpoint(null);
  };

  const handleSelect = (endpoint: S3Endpoint) => {
    onSelectEndpoint(endpoint.name);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <CloudServerOutlined />
          <a onClick={() => onSelectEndpoint(name)}>{name}</a>
        </Space>
      ),
    },
    {
      title: 'Endpoint URL',
      dataIndex: 'endpoint',
      key: 'endpoint',
    },
    {
      title: 'Region',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: S3Endpoint) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          />
          <Popconfirm
            title="Delete this endpoint?"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(record.name);
            }}
            onCancel={(e) => e?.stopPropagation()}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const endpoints = loadEndpoints();
  return (
    <Card
      title={
        <NavigationBar />
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
        </Button>
      }
    >
      <Table
        dataSource={endpoints}
        columns={columns}
        rowKey="name"
        size="small"
        pagination={
          {
            defaultPageSize: 10,
            showSizeChanger: true,
          }
        }
        scroll={{ x: 'max-content' }}
        onRow={(record) => ({
          style: {
            backgroundColor: selectedEndpoint === record.name ? token.controlItemBgActive : undefined,
            cursor: 'pointer',
          },
          onClick: () => handleSelect(record),
        })}
      />

      <Modal
        title={editingEndpoint ? 'Edit Endpoint' : 'Add Endpoint'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="My S3 Endpoint" />
          </Form.Item>
          <Form.Item
            name="endpoint"
            label="Endpoint URL"
            rules={[{ required: true, message: 'Please enter endpoint URL' }]}
          >
            <Input placeholder="https://s3.amazonaws.com or http://localhost:9000" />
          </Form.Item>
          <Form.Item
            name="region"
            label="Region"
            rules={[{ required: true, message: 'Please enter region' }]}
          >
            <Input placeholder="us-east-1" />
          </Form.Item>
          <Form.Item
            name="accessKeyId"
            label="Access Key ID"
            rules={[{ required: true, message: 'Please enter access key' }]}
          >
            <Input placeholder="Access Key ID" />
          </Form.Item>
          <Form.Item
            name="secretAccessKey"
            label="Secret Access Key"
            rules={[{ required: true, message: 'Please enter secret key' }]}
          >
            <Input.Password placeholder="Secret Access Key" />
          </Form.Item>
          <Form.Item
            name="forcePathStyle"
            label="Force Path Style"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default EndpointManager;
