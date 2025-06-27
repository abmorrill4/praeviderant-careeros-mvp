
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProfileTimelinePage from '@/pages/ProfileTimelinePage';
import ProfileManagementPage from '@/pages/ProfileManagementPage';
import ProfileOptimizationPage from '@/pages/ProfileOptimizationPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple temporary home page component
const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to Praeviderant
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        Your AI-powered career assistant
      </p>
      <div className="space-x-4">
        <a href="/profile-timeline" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-block">
          View Profile Timeline
        </a>
        <a href="/profile-optimization" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-block">
          Optimize Profile
        </a>
      </div>
    </div>
  </div>
);

// Simple protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Simple placeholder pages
const ApplicationToolkitPage = () => (
  <div className="min-h-screen p-8">
    <h1 className="text-3xl font-bold mb-4">Application Toolkit</h1>
    <p>Coming soon...</p>
  </div>
);

const InterviewPage = () => (
  <div className="min-h-screen p-8">
    <h1 className="text-3xl font-bold mb-4">Interview Assistant</h1>
    <p>Coming soon...</p>
  </div>
);

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
                <Route path="/" element={<HomePage />} />
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
