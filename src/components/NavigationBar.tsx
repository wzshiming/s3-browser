import React from 'react';
import { Breadcrumb } from 'antd';
import { CloudServerOutlined } from '@ant-design/icons';

interface NavigationBarProps {
  endpointName?: string;
  bucketName?: string;
  path?: string;
  onNavigateEndpoints?: () => void;
  onNavigateBuckets?: () => void;
  onNavigatePath?: (path: string) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  endpointName,
  bucketName,
  path,
  onNavigateEndpoints,
  onNavigateBuckets,
  onNavigatePath,
}) => {
  const items: Array<{ key: string; title: React.ReactNode }> = [];


  items.push({
    key: 'endpoints',
    title: onNavigateEndpoints ? (
      <a onClick={onNavigateEndpoints}>
        <CloudServerOutlined style={{ marginRight: 4 }} />
        Home
      </a>
    ) : (
      <span>
        <CloudServerOutlined style={{ marginRight: 4 }} />
        Home
      </span>
    ),
  });


  // Endpoint name level
  if (endpointName) {
    if (!bucketName && !path) {
      items.push({
        key: 'endpoint',
        title: <span>{endpointName}</span>,
      });
    } else {
      items.push({
        key: 'endpoint',
        title: onNavigateBuckets ? (
          <a onClick={onNavigateBuckets}>{endpointName}</a>
        ) : (
          <span>{endpointName}</span>
        ),
      });
    }
  }

  // Bucket level
  if (bucketName) {
    if (!path) {
      items.push({
        key: 'bucket',
        title: <span>{bucketName}</span>,
      });
    } else {
      items.push({
        key: 'bucket',
        title: onNavigatePath ? (
          <a onClick={() => onNavigatePath('')}>{bucketName}</a>
        ) : (
          <span>{bucketName}</span>
        ),
      });
    }
  }

  // Path segments
  if (path) {
    const parts = path.split('/').filter(Boolean);
    let accPath = '';
    parts.forEach((part, index) => {
      accPath += part + '/';
      const pathCopy = accPath;
      const isFile = !path.endsWith('/') && index === parts.length - 1;
      const isLast = index === parts.length - 1;

      if (isLast) {
        items.push({
          key: pathCopy,
          title: <span>{part}</span>,
        });

        if (!isFile) {
          items.push({
            key: "",
            title: <span></span>,
          });
        }
      } else {
        items.push({
          key: pathCopy,
          title: onNavigatePath ? (
            <a onClick={() => onNavigatePath(pathCopy)}>{part}</a>
          ) : (
            <span>{part}</span>
          ),
        });
      }
    });
  }

  return <Breadcrumb items={items} />;
};

export default NavigationBar;
