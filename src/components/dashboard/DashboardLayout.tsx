
import React from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { 
  User, 
  LogOut, 
  Mic,
  FileText,
  Users,
  BarChart3,
  Briefcase,
  Database,
  Upload,
  Settings,
  Activity
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "profile", label: "Profile Data", icon: User },
  { id: "interview", label: "AI Interview", icon: Mic },
  { id: "toolkit", label: "Application Toolkit", icon: Briefcase },
  { id: "resumes", label: "My Resumes", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "team", label: "Team", icon: Users },
  { id: "data-management", label: "Data Management", icon: Database, path: "/data-management" },
  { id: "resume-upload", label: "Resume Upload", icon: Upload, path: "/resume-upload-v2" },
  { id: "resume-timeline", label: "Processing Timeline", icon: Activity, path: "/resume-timeline" },
  { id: "entity-graph-admin", label: "Entity Graph Admin", icon: Settings, path: "/entity-graph-admin" },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onTabChange
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleMenuItemClick = (item: typeof menuItems[0]) => {
    if (item.path) {
      // Navigate to standalone page
      navigate(item.path);
    } else {
      // For dashboard tabs, navigate to dashboard with the tab parameter
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
      }
      onTabChange(item.id);
    }
  };

  const isItemActive = (item: typeof menuItems[0]) => {
    if (item.path) {
      return location.pathname === item.path;
    } else {
      // Check if we're on dashboard and the tab is active
      return location.pathname === '/dashboard' && activeTab === item.id;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-800">
                  Praeviderant
                </h2>
                <p className="text-xs text-slate-600">
                  Beta
                </p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleMenuItemClick(item)}
                    isActive={isItemActive(item)}
                    className="w-full justify-start"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter className="p-4 space-y-2">
            <div className="flex items-center space-x-2 px-2 py-1">
              <User className="w-4 h-4" />
              <span className="text-sm text-slate-800">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center justify-end">
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="ml-auto flex items-center space-x-4">
                <span className="text-sm text-slate-600">
                  Welcome back, {user?.email?.split('@')[0]}
                </span>
              </div>
            </header>
            
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
