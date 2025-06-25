
import React from 'react';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';
import EntityGraphAdminUI from '@/components/admin/EntityGraphAdminUI';
import ErrorBoundary from '@/components/ErrorBoundary';

const EntityGraphAdmin: React.FC = () => {
  return (
    <DashboardPageLayout>
      <ErrorBoundary>
        <EntityGraphAdminUI />
      </ErrorBoundary>
    </DashboardPageLayout>
  );
};

export default EntityGraphAdmin;
