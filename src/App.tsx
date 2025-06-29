
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import InterviewPage from "./pages/InterviewPage";
import ProfileManagementPage from "./pages/ProfileManagementPage";
import ApplicationToolkitPage from "./pages/ApplicationToolkitPage";
import ProfileOptimizationPage from "./pages/ProfileOptimizationPage";
import NotFound from "./pages/NotFound";
import ResumeUploadV2 from "./pages/ResumeUploadV2";
import ProfileTimelinePage from "./pages/ProfileTimelinePage";
import EntityGraphAdmin from "./pages/EntityGraphAdmin";
import ResumeTimelinePage from "./pages/ResumeTimelinePage";
import ProcessingPage from "./pages/ProcessingPage";
import DebugAnalysisPage from "./pages/DebugAnalysisPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/interview" element={<InterviewPage />} />
                <Route path="/profile-management" element={<ProfileManagementPage />} />
                <Route path="/application-toolkit" element={<ApplicationToolkitPage />} />
                <Route path="/profile-optimization" element={<ProfileOptimizationPage />} />
                <Route path="/resume-upload" element={<ResumeUploadV2 />} />
                <Route path="/profile-timeline" element={<ProfileTimelinePage />} />
                <Route path="/admin/entity-graph" element={<EntityGraphAdmin />} />
                <Route path="/admin/resume-timeline" element={<ResumeTimelinePage />} />
                <Route path="/processing/:enrichmentId" element={<ProcessingPage />} />
                <Route path="/debug/:versionId?" element={<DebugAnalysisPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
