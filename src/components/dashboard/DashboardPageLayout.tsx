
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

interface DashboardPageLayoutProps {
  children: React.ReactNode;
}

const DashboardPageLayout: React.FC<DashboardPageLayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <ErrorBoundary>
      <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </DashboardLayout>
    </ErrorBoundary>
  );
};

export default DashboardPageLayout;
