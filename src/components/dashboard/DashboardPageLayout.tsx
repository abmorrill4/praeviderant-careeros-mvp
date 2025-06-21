import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface DashboardPageLayoutProps {
  children: React.ReactNode;
}

const DashboardPageLayout: React.FC<DashboardPageLayoutProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {children}
    </DashboardLayout>
  );
};

export default DashboardPageLayout;
