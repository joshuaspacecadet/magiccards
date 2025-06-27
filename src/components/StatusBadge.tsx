import React from 'react';
import { ProjectStage, PROJECT_STAGE_CARD_LABELS, PROJECT_STAGE_COLORS } from '../types';

interface StatusBadgeProps {
  status: ProjectStage;
  className?: string;
  useCardLabels?: boolean; // New prop to determine which labels to use
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className = '', 
  useCardLabels = false 
}) => {
  const label = useCardLabels ? PROJECT_STAGE_CARD_LABELS[status] : status;
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PROJECT_STAGE_COLORS[status]} ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;