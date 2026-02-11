import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  List,
  Card,
  Space,
  Popconfirm,
  Switch,
  message,
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
  generateId,
} from '../services/storage';

interface EndpointManagerProps {
  selectedEndpoint: S3Endpoint | null;
  onSelectEndpoint: (endpoint: S3Endpoint | null) => void;
  initialEndpointName?: string | null;
}

const EndpointManager: React.FC<EndpointManagerProps> = ({
  selectedEndpoint,
  onSelectEndpoint,
  initialEndpointName,
}) => {
  // Load endpoints from storage on initial render only
  const [endpoints, setEndpoints] = useState<S3Endpoint[]>(() => {
    const loaded = loadEndpoints();
    return loaded;
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<S3Endpoint | null>(null);
  const [form] = Form.useForm();
  const initializedRef = useRef(false);

  // Auto-select endpoint from hash or first endpoint if none selected (runs once after initial render)
  useEffect(() => {
    if (!initializedRef.current && endpoints.length > 0 && !selectedEndpoint) {
      const matchedEndpoint = endpoints.find(ep => ep.name === initialEndpointName);
      onSelectEndpoint(matchedEndpoint ?? endpoints[0]);
    }
    initializedRef.current = true;
  }, [endpoints, selectedEndpoint, onSelectEndpoint, initialEndpointName]);

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

  const handleDelete = (id: string) => {
    deleteEndpoint(id);
    const updated = loadEndpoints();
    setEndpoints(updated);
    if (selectedEndpoint?.id === id) {
      onSelectEndpoint(updated.length > 0 ? updated[0] : null);
    }
    message.success('Endpoint deleted');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingEndpoint) {
        const updated = { ...editingEndpoint, ...values };
        updateEndpoint(updated);
        if (selectedEndpoint?.id === updated.id) {
          onSelectEndpoint(updated);
        }
        message.success('Endpoint updated');
      } else {
        const newEndpoint: S3Endpoint = {
          id: generateId(),
          ...values,
        };
        addEndpoint(newEndpoint);
        message.success('Endpoint added');
      }
      setEndpoints(loadEndpoints());
      setModalVisible(false);
    } catch {
      // Validation failed
    }
  };

  const handleSelect = (endpoint: S3Endpoint) => {
    onSelectEndpoint(endpoint);
  };

  return (
    <Card
      title={
        <Space>
          <CloudServerOutlined />
          S3 Endpoints
        </Space>
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
                selectedEndpoint?.id === endpoint.id ? '#e6f7ff' : undefined,
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
                  handleDelete(endpoint.id);
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
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
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
