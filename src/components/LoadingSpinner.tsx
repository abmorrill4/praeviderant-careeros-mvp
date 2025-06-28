
import React from 'react';
import { LoadingSpinner as UILoadingSpinner } from '@/components/ui/loading-spinner';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = (props) => {
  return <UILoadingSpinner {...props} />;
};

export default LoadingSpinner;
