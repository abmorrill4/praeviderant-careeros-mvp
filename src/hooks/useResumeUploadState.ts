
import { useState } from 'react';

export interface ResumeUploadFilters {
  status?: string;
  processingStage?: string;
  dateRange?: string;
}

export function useResumeUploadState() {
  const [filters, setFilters] = useState<ResumeUploadFilters>({
    status: 'all',
    processingStage: 'all',
    dateRange: 'all'
  });

  const [activeTab, setActiveTab] = useState('upload');

  const handleFilterChange = (key: keyof ResumeUploadFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? 'all' : value || 'all'
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      processingStage: 'all',
      dateRange: 'all'
    });
  };

  return {
    filters,
    activeTab,
    setActiveTab,
    handleFilterChange,
    clearFilters
  };
}
