import type { S3Endpoint, Bucket, BucketProperties } from '../types';
import { EndpointManager } from './EndpointManager';
import { BucketList } from './BucketList';
import './Sidebar.css';

interface SidebarProps {
  endpoints: S3Endpoint[];
  selectedEndpoint: S3Endpoint | null;
  buckets: Bucket[];
  selectedBucket: Bucket | null;
  loading: boolean;
  onEndpointSelect: (endpoint: S3Endpoint) => void;
  onEndpointAdd: (endpoint: Omit<S3Endpoint, 'id'>) => S3Endpoint;
  onEndpointUpdate: (endpoint: S3Endpoint) => void;
  onEndpointDelete: (endpointId: string) => void;
  onBucketSelect: (bucket: Bucket) => void;
  onBucketRefresh: () => void;
  onBucketCreate: (name: string) => Promise<void>;
  onBucketDelete: (name: string) => Promise<void>;
  onBucketGetProperties: (name: string) => Promise<BucketProperties | null>;
}

export function Sidebar({
  endpoints,
  selectedEndpoint,
  buckets,
  selectedBucket,
  loading,
  onEndpointSelect,
  onEndpointAdd,
  onEndpointUpdate,
  onEndpointDelete,
  onBucketSelect,
  onBucketRefresh,
  onBucketCreate,
  onBucketDelete,
  onBucketGetProperties,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>S3 Browser</h1>
      </div>
      
      <EndpointManager
        endpoints={endpoints}
        selectedEndpoint={selectedEndpoint}
        onSelect={onEndpointSelect}
        onAdd={onEndpointAdd}
        onUpdate={onEndpointUpdate}
        onDelete={onEndpointDelete}
      />

      {selectedEndpoint && (
        <BucketList
          buckets={buckets}
          selectedBucket={selectedBucket}
          loading={loading}
          onSelect={onBucketSelect}
          onRefresh={onBucketRefresh}
          onCreate={onBucketCreate}
          onDelete={onBucketDelete}
          onGetProperties={onBucketGetProperties}
        />
      )}
    </aside>
  );
}
