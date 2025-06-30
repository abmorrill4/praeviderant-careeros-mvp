
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ResumeUpload from "./pages/ResumeUpload";
import Dashboard from "./pages/Dashboard";
import ProfileTimelinePage from "./pages/ProfileTimelinePage";
import ProfileOptimizationPage from "./pages/ProfileOptimizationPage";
import ProfileManagementPage from "./pages/ProfileManagementPage";
import ResumeTimelinePage from "./pages/ResumeTimelinePage";
import ResumeUploadV2 from "./pages/ResumeUploadV2";
import EntityGraphAdmin from "./pages/EntityGraphAdmin";
import InterviewPage from "./pages/InterviewPage";
import ApplicationToolkitPage from "./pages/ApplicationToolkitPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile-timeline" element={<ProfileTimelinePage />} />
                <Route path="/profile-optimization" element={<ProfileOptimizationPage />} />
                <Route path="/profile-management" element={<ProfileManagementPage />} />
                <Route path="/upload" element={<ResumeUpload />} />
                <Route path="/resume-upload-v2" element={<ResumeUploadV2 />} />
                <Route path="/resume-timeline" element={<ResumeTimelinePage />} />
                <Route path="/entity-graph-admin" element={<EntityGraphAdmin />} />
                <Route path="/interview" element={<InterviewPage />} />
                <Route path="/application-toolkit" element={<ApplicationToolkitPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </NextThemeProvider>
  </QueryClientProvider>
);

export default App;
