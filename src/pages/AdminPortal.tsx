import React, { useState } from 'react';
import { AdminPortalLayout } from '@/components/admin/AdminPortalLayout';
import { SystemManagementModule } from '@/components/admin/modules/SystemManagementModule';
import { DataManagementModule } from '@/components/admin/modules/DataManagementModule';
import { SecurityComplianceModule } from '@/components/admin/modules/SecurityComplianceModule';
import { AIContentModule } from '@/components/admin/modules/AIContentModule';
import { UserManagementModule } from '@/components/admin/modules/UserManagementModule';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export type AdminModule = 
  | 'system' 
  | 'data' 
  | 'security' 
  | 'ai-content' 
  | 'users';

const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState<AdminModule>('system');

  // TODO: Add proper admin role check
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'system':
        return <SystemManagementModule />;
      case 'data':
        return <DataManagementModule />;
      case 'security':
        return <SecurityComplianceModule />;
      case 'ai-content':
        return <AIContentModule />;
      case 'users':
        return <UserManagementModule />;
      default:
        return <SystemManagementModule />;
    }
  };

  return (
    <AdminPortalLayout
      activeModule={activeModule}
      onModuleChange={setActiveModule}
    >
      {renderActiveModule()}
    </AdminPortalLayout>
  );
};

export default AdminPortal;