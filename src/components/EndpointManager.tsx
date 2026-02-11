import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  List,
  Card,
  Popconfirm,
  Switch,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
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

  const [editingEndpoint, setEditingEndpoint] = useState<S3Endpoint | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingEndpoint(null);
    form.resetFields();
    form.setFieldsValue({ forcePathStyle: true, region: 'us-east-1' });
  };

  const handleEdit = (endpoint: S3Endpoint) => {
    setEditingEndpoint(endpoint);
    form.setFieldsValue(endpoint);
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
    } catch {
      // Validation failed
    }
  };

  const handleSelect = (endpoint: S3Endpoint) => {
    onSelectEndpoint(endpoint.name);
  };

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
      style={{ marginBottom: 16 }}
    >
      <List
        dataSource={endpoints}
        renderItem={(endpoint) => (
          <List.Item
            style={{
              cursor: 'pointer',
              backgroundColor:
                selectedEndpoint === endpoint.name ? '#e6f7ff' : undefined,
              padding: '8px 12px',
              borderRadius: 4,
            }}
            onClick={() => handleSelect(endpoint)}
            actions={[
              <Button
                key="edit"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(endpoint);
                }}
              />,
              <Popconfirm
                key="delete"
                title="Delete this endpoint?"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  handleDelete(endpoint.name);
                }}
                onCancel={(e) => e?.stopPropagation()}
              >
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={endpoint.name}
              description={`${endpoint.endpoint} (${endpoint.region})`}
            />
          </List.Item>
        )}
        locale={{ emptyText: 'No endpoints configured. Click "Add" to add one.' }}
      />

      <Modal
        title={editingEndpoint ? 'Edit Endpoint' : 'Add Endpoint'}
        onOk={handleSubmit}
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
