
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Don't render dashboard content if we're on a different route
  if (location.pathname !== "/dashboard") {
    return null;
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <DashboardContent activeTab={activeTab} onTabChange={setActiveTab} />
    </DashboardLayout>
  );
};

export default Dashboard;
