
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    console.log('Dashboard: user state changed', { user: user?.email, loading });
  }, [user, loading]);

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    console.log('Dashboard: No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('Dashboard: Rendering dashboard for user', user.email);

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <DashboardContent activeTab={activeTab} onTabChange={setActiveTab} />
    </DashboardLayout>
  );
};

export default Dashboard;
