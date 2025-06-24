
import React from 'react';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';
import EntityGraphAdminUI from '@/components/admin/EntityGraphAdminUI';

const EntityGraphAdmin: React.FC = () => {
  return (
    <DashboardPageLayout>
      <EntityGraphAdminUI />
    </DashboardPageLayout>
  );
};

export default EntityGraphAdmin;
