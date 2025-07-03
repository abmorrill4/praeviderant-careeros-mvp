
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileTimelinePage from "./pages/ProfileTimelinePage";
import ProfileOptimizationPage from "./pages/ProfileOptimizationPage";
import ProfileManagementPage from "./pages/ProfileManagementPage";
import InterviewPage from "./pages/InterviewPage";
import ApplicationToolkitPage from "./pages/ApplicationToolkitPage";
import AdminPortal from "./pages/AdminPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile-timeline" element={<ProfileTimelinePage />} />
              <Route path="/profile-optimization" element={<ProfileOptimizationPage />} />
              <Route path="/profile-management" element={<ProfileManagementPage />} />
              <Route path="/interview" element={<InterviewPage />} />
              <Route path="/application-toolkit" element={<ApplicationToolkitPage />} />
              <Route path="/admin" element={<AdminPortal />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
