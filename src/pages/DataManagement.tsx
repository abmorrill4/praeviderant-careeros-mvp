
import React from 'react';
import { DataManagement as DataManagementComponent } from '@/components/DataManagement';

const DataManagement = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Management</h1>
        <p className="text-muted-foreground">
          Manage your personal data and privacy settings
        </p>
      </div>
      <DataManagementComponent />
    </div>
  );
};

export default DataManagement;
