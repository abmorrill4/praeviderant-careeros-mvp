import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Navigate } from 'react-router-dom';
import { CleanNavigation } from '@/components/navigation/CleanNavigation';
import { AdminContent } from '@/components/admin/AdminContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Shield, AlertTriangle } from 'lucide-react';

const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, loading, error } = useAdminCheck();

  // Redirect to home if not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Show loading state while checking admin status
  if (loading) {
    return (
      <CleanNavigation>
        <div className="flex items-center justify-center min-h-[60vh]">
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
      </CleanNavigation>
    );
  }

  // Show access denied if not admin or error occurred
  if (!isAdmin || error) {
    return (
      <CleanNavigation>
        <div className="flex items-center justify-center min-h-[60vh]">
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
            </CardContent>
          </Card>
        </div>
      </CleanNavigation>
    );
  }

  // Admin users get access to the admin content with sidebar
  return (
    <CleanNavigation>
      <div className="h-full flex flex-col">
        <div className="bg-white border-b p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-600">
            System administration and management tools
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <AdminContent />
        </div>
      </div>
    </CleanNavigation>
  );
};

export default AdminPortal;