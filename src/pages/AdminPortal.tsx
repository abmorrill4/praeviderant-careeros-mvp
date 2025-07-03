import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { AdminContent } from '@/components/admin/AdminContent';

const AdminPortal: React.FC = () => {
  const { user } = useAuth();

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Use the clean admin navigation component
  return (
    <AdminNavigation>
      <AdminContent />
    </AdminNavigation>
  );
};

export default AdminPortal;