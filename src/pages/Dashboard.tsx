
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Settings, 
  LogOut, 
  Mic,
  FileText,
  Users,
  BarChart3
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AIInterviewPage from "@/components/interview/AIInterviewPage";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("interview");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    { id: "interview", label: "AI Interview", icon: Mic },
    { id: "resumes", label: "My Resumes", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "team", label: "Team", icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "interview":
        return <AIInterviewPage />;
      case "resumes":
        return (
          <div className="space-y-6">
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              My Resumes
            </h2>
            <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
              <CardContent className="p-8 text-center">
                <FileText className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  No resumes yet
                </h3>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-4`}>
                  Complete an AI interview to generate your first resume
                </p>
                <Button 
                  onClick={() => setActiveTab("interview")}
                  className="bg-career-accent hover:bg-career-accent-dark text-white"
                >
                  Start Interview
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case "analytics":
        return (
          <div className="space-y-6">
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              Analytics
            </h2>
            <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
              <CardContent className="p-8 text-center">
                <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Analytics Coming Soon
                </h3>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Track your interview progress and resume performance
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "team":
        return (
          <div className="space-y-6">
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              Team Management
            </h2>
            <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
              <CardContent className="p-8 text-center">
                <Users className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Team Features Coming Soon
                </h3>
                <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Collaborate with your team on career development
                </p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <AIInterviewPage />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-career-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <h2 className={`font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Praeviderant
                </h2>
                <p className={`text-xs ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
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
                    onClick={() => setActiveTab(item.id)}
                    isActive={activeTab === item.id}
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
              <span className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-text-dark' : 'text-career-text-muted-light hover:text-career-text-light'}`}
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
                <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Welcome back, {user.email?.split('@')[0]}
                </span>
              </div>
            </header>
            
            <main className="flex-1 overflow-auto p-6">
              {renderContent()}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
