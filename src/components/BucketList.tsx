import { useState, useEffect } from 'react';
import type { Bucket, BucketProperties } from '../types';
import { formatDate } from '../utils/format';
import './BucketList.css';

interface BucketListProps {
  buckets: Bucket[];
  selectedBucket: Bucket | null;
  loading: boolean;
  onSelect: (bucket: Bucket) => void;
  onRefresh: () => void;
  onCreate: (name: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
  onGetProperties: (name: string) => Promise<BucketProperties | null>;
}

export function BucketList({
  buckets,
  selectedBucket,
  loading,
  onSelect,
  onRefresh,
  onCreate,
  onDelete,
  onGetProperties,
}: BucketListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<BucketProperties | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (buckets.length === 0 && !loading) {
      onRefresh();
    }
  }, [buckets.length, loading, onRefresh]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;
    setCreating(true);
    try {
      await onCreate(newBucketName.trim().toLowerCase());
      setNewBucketName('');
      setShowCreateModal(false);
    } catch {
      // Error handled by parent
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (bucketName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete bucket "${bucketName}"?`)) {
      await onDelete(bucketName);
    }
  };

  const handleShowProperties = async (bucket: Bucket, e: React.MouseEvent) => {
    e.stopPropagation();
    const props = await onGetProperties(bucket.name);
    if (props) {
      setSelectedProperties({ ...props, creationDate: bucket.creationDate });
      setShowPropertiesModal(true);
    }
  };

  return (
    <div className="bucket-list">
      <div className="bucket-header">
        <h3>Buckets</h3>
        <div className="bucket-actions">
          <button className="icon-btn" onClick={onRefresh} title="Refresh" disabled={loading}>
            ↻
          </button>
          <button className="icon-btn" onClick={() => setShowCreateModal(true)} title="Create Bucket">
            +
          </button>
        </div>
      </div>

      <div className="bucket-items">
        {loading && buckets.length === 0 ? (
          <div className="loading">Loading buckets...</div>
        ) : buckets.length === 0 ? (
          <div className="empty-state">
            <p>No buckets found</p>
            <button onClick={() => setShowCreateModal(true)}>Create a bucket</button>
          </div>
        ) : (
          buckets.map((bucket) => (
            <div
              key={bucket.name}
              className={`bucket-item ${selectedBucket?.name === bucket.name ? 'selected' : ''}`}
              onClick={() => onSelect(bucket)}
            >
              <div className="bucket-icon">📦</div>
              <div className="bucket-info">
                <span className="bucket-name">{bucket.name}</span>
                {bucket.creationDate && (
                  <span className="bucket-date">{formatDate(bucket.creationDate)}</span>
                )}
              </div>
              <div className="bucket-item-actions">
                <button
                  className="icon-btn small"
                  onClick={(e) => handleShowProperties(bucket, e)}
                  title="Properties"
                >
                  ℹ
                </button>
                <button
                  className="icon-btn small delete"
                  onClick={(e) => handleDelete(bucket.name, e)}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Bucket Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Bucket</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="bucketName">Bucket Name</label>
                <input
                  id="bucketName"
                  type="text"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  placeholder="my-new-bucket"
                  pattern="[a-z0-9][a-z0-9.-]*[a-z0-9]"
                  title="Bucket names must be lowercase, and can contain letters, numbers, dots, and hyphens"
                  required
                  autoFocus
                />
                <small>Bucket names must be lowercase and can contain letters, numbers, dots, and hyphens.</small>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Properties Modal */}
      {showPropertiesModal && selectedProperties && (
        <div className="modal-overlay" onClick={() => setShowPropertiesModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Bucket Properties</h3>
            <div className="properties-list">
              <div className="property-item">
                <span className="property-label">Name</span>
                <span className="property-value">{selectedProperties.name}</span>
              </div>
              <div className="property-item">
                <span className="property-label">Created</span>
                <span className="property-value">
                  {formatDate(selectedProperties.creationDate)}
                </span>
              </div>
              <div className="property-item">
                <span className="property-label">Region</span>
                <span className="property-value">{selectedProperties.region || 'Unknown'}</span>
              </div>
              <div className="property-item">
                <span className="property-label">Versioning</span>
                <span className="property-value">
                  {selectedProperties.versioning ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div className="form-actions">
              <button onClick={() => setShowPropertiesModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
