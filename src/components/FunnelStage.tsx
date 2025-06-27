import React, { useState, useEffect, forwardRef } from 'react';
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectStage } from '../types';

interface FunnelStageProps {
  stage: ProjectStage;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  onAdvance?: () => void;
  children?: React.ReactNode;
}

const FunnelStage = forwardRef<HTMLDivElement, FunnelStageProps>(({
  stage,
  title,
  description,
  isActive,
  isCompleted,
  onAdvance,
  children
}, ref) => {
  // Initialize content open state based on stage status
  const [isContentOpen, setIsContentOpen] = useState(() => {
    if (isActive) return true;
    if (isCompleted) return false;
    return false;
  });

  // Update content open state when stage status changes
  useEffect(() => {
    if (isActive) {
      setIsContentOpen(true);
    } else if (isCompleted) {
      setIsContentOpen(false);
    }
  }, [isActive, isCompleted]);

  const getIcon = () => {
    if (isCompleted) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    if (isActive) {
      return <Clock className="h-6 w-6 text-blue-600" />;
    }
    return <AlertCircle className="h-6 w-6 text-slate-400" />;
  };

  const getChevronIcon = () => {
    return isContentOpen ? (
      <ChevronUp className="h-5 w-5 text-slate-500" />
    ) : (
      <ChevronDown className="h-5 w-5 text-slate-500" />
    );
  };

  const toggleContent = () => {
    setIsContentOpen(!isContentOpen);
  };

  return (
    <div 
      ref={ref}
      className={`
        rounded-xl border-2 transition-all duration-200
        ${isActive 
          ? 'border-blue-200 bg-blue-50 shadow-lg' 
          : isCompleted 
            ? 'border-green-200 bg-green-50' 
            : 'border-slate-200 bg-white'
        }
      `}
    >
      {/* Clickable Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-opacity-80 transition-colors"
        onClick={toggleContent}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${
                isActive ? 'text-blue-900' 
                : isCompleted ? 'text-green-900' 
                : 'text-slate-700'
              }`}>
                {title}
              </h3>
              <p className={`text-sm ${
                isActive ? 'text-blue-700' 
                : isCompleted ? 'text-green-700' 
                : 'text-slate-600'
              }`}>
                {description}
              </p>
            </div>
          </div>
          
          {/* Chevron Icon */}
          <div className="flex-shrink-0 ml-4">
            {getChevronIcon()}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isContentOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="px-6 pb-6">
          {children && (
            <div className="mb-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

FunnelStage.displayName = 'FunnelStage';

export default FunnelStage;