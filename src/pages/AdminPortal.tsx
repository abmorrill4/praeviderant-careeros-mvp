import React, { useState } from 'react';
import { AdminPortalLayout } from '@/components/admin/AdminPortalLayout';
import { SystemManagementModule } from '@/components/admin/modules/SystemManagementModule';
import { DataManagementModule } from '@/components/admin/modules/DataManagementModule';
import { SecurityComplianceModule } from '@/components/admin/modules/SecurityComplianceModule';
import { AIContentModule } from '@/components/admin/modules/AIContentModule';
import { UserManagementModule } from '@/components/admin/modules/UserManagementModule';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Shield, AlertTriangle } from 'lucide-react';

export type AdminModule = 
  | 'system' 
  | 'data' 
  | 'security' 
  | 'ai-content' 
  | 'users';

const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, loading, error } = useAdminCheck();
  const [activeModule, setActiveModule] = useState<AdminModule>('system');

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading state while checking admin status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-6 h-6" />
              Admin Portal
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-muted-foreground">Verifying admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if not admin or error occurred
  if (!isAdmin || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {error ? 'Error verifying admin status' : 'You do not have permission to access the admin portal.'}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
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