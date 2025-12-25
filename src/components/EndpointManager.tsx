import { useState } from 'react';
import type { S3Endpoint } from '../types';
import './EndpointManager.css';

interface EndpointManagerProps {
  endpoints: S3Endpoint[];
  selectedEndpoint: S3Endpoint | null;
  onSelect: (endpoint: S3Endpoint) => void;
  onAdd: (endpoint: Omit<S3Endpoint, 'id'>) => S3Endpoint;
  onUpdate: (endpoint: S3Endpoint) => void;
  onDelete: (endpointId: string) => void;
}

interface EndpointFormData {
  name: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

const emptyForm: EndpointFormData = {
  name: '',
  endpoint: '',
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
  forcePathStyle: true,
};

export function EndpointManager({
  endpoints,
  selectedEndpoint,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
}: EndpointManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<S3Endpoint | null>(null);
  const [formData, setFormData] = useState<EndpointFormData>(emptyForm);
  const [showSecrets, setShowSecrets] = useState(false);

  const handleOpenAddForm = () => {
    setFormData(emptyForm);
    setEditingEndpoint(null);
    setShowForm(true);
    setShowSecrets(false);
  };

  const handleOpenEditForm = (endpoint: S3Endpoint) => {
    setFormData({
      name: endpoint.name,
      endpoint: endpoint.endpoint,
      region: endpoint.region,
      accessKeyId: endpoint.accessKeyId,
      secretAccessKey: endpoint.secretAccessKey,
      forcePathStyle: endpoint.forcePathStyle ?? true,
    });
    setEditingEndpoint(endpoint);
    setShowForm(true);
    setShowSecrets(false);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEndpoint(null);
    setFormData(emptyForm);
    setShowSecrets(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEndpoint) {
      onUpdate({ ...formData, id: editingEndpoint.id });
    } else {
      const newEndpoint = onAdd(formData);
      onSelect(newEndpoint);
    }
    handleCloseForm();
  };

  const handleDelete = (endpointId: string) => {
    if (window.confirm('Are you sure you want to delete this endpoint?')) {
      onDelete(endpointId);
    }
  };

  return (
    <div className="endpoint-manager">
      <div className="endpoint-header">
        <h3>S3 Endpoints</h3>
        <button className="add-btn" onClick={handleOpenAddForm}>
          + Add
        </button>
      </div>

      <div className="endpoint-list">
        {endpoints.length === 0 ? (
          <div className="empty-state">
            <p>No endpoints configured</p>
            <button onClick={handleOpenAddForm}>Add your first endpoint</button>
          </div>
        ) : (
          endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className={`endpoint-item ${selectedEndpoint?.id === endpoint.id ? 'selected' : ''}`}
              onClick={() => onSelect(endpoint)}
            >
              <div className="endpoint-info">
                <span className="endpoint-name">{endpoint.name}</span>
                <span className="endpoint-url">{endpoint.endpoint}</span>
              </div>
              <div className="endpoint-actions">
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditForm(endpoint);
                  }}
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  className="icon-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(endpoint.id);
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingEndpoint ? 'Edit Endpoint' : 'Add New Endpoint'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My S3 Server"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endpoint">Endpoint URL</label>
                <input
                  id="endpoint"
                  type="url"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="https://s3.amazonaws.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="region">Region</label>
                <input
                  id="region"
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="us-east-1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="accessKeyId">Access Key ID</label>
                <input
                  id="accessKeyId"
                  type={showSecrets ? 'text' : 'password'}
                  value={formData.accessKeyId}
                  onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="secretAccessKey">Secret Access Key</label>
                <input
                  id="secretAccessKey"
                  type={showSecrets ? 'text' : 'password'}
                  value={formData.secretAccessKey}
                  onChange={(e) => setFormData({ ...formData, secretAccessKey: e.target.value })}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={showSecrets}
                    onChange={(e) => setShowSecrets(e.target.checked)}
                  />
                  Show secrets
                </label>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.forcePathStyle}
                    onChange={(e) => setFormData({ ...formData, forcePathStyle: e.target.checked })}
                  />
                  Force path style (for MinIO, LocalStack, etc.)
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCloseForm}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  {editingEndpoint ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
