import React from 'react';
import { Progress } from 'antd';

interface UploadProgressProps {
  uploading: boolean;
  percent: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  uploading,
  percent,
}) => {
  if (!uploading) return null;

  return (
    <Progress
      percent={percent}
      status="active"
      style={{ marginBottom: 16 }}
    />
  );
};

export default UploadProgress;
