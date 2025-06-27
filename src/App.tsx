import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Index from '@/pages/Index';
import ProfileTimelinePage from '@/pages/ProfileTimelinePage';
import ProfileManagementPage from '@/pages/ProfileManagementPage';
import ProfileOptimizationPage from '@/pages/ProfileOptimizationPage';
import ApplicationToolkitPage from '@/pages/ApplicationToolkitPage';
import InterviewPage from '@/pages/InterviewPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/profile-timeline" element={
                  <ProtectedRoute>
                    <ProfileTimelinePage />
                  </ProtectedRoute>
                } />
                <Route path="/profile-management" element={
                  <ProtectedRoute>
                    <ProfileManagementPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile-optimization" element={
                  <ProtectedRoute>
                    <ProfileOptimizationPage />
                  </ProtectedRoute>
                } />
                <Route path="/application-toolkit" element={
                  <ProtectedRoute>
                    <ApplicationToolkitPage />
                  </ProtectedRoute>
                } />
                <Route path="/interview" element={
                  <ProtectedRoute>
                    <InterviewPage />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
