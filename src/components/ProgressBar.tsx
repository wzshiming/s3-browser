import React from 'react';
import { Progress } from 'antd';

interface ProgressBarProps {
  enable: boolean;
  percent: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  enable: enable,
  percent,
}) => {
  if (!enable) return null;

  return (
    <Progress
      percent={percent}
      status="active"
      style={{ marginBottom: 16 }}
    />
  );
};

export default ProgressBar;
