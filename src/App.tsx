
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DataManagement from "./pages/DataManagement";
import ResumeUploadV2 from "./pages/ResumeUploadV2";
import ResumeTimelinePage from "./pages/ResumeTimelinePage";
import EntityGraphAdmin from "./pages/EntityGraphAdmin";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/data-management"
        element={
          <ProtectedRoute>
            <DataManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-upload-v2"
        element={
          <ProtectedRoute>
            <ResumeUploadV2 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-timeline"
        element={
          <ProtectedRoute>
            <ResumeTimelinePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entity-graph-admin"
        element={
          <ProtectedRoute>
            <EntityGraphAdmin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <AppRoutes />
              </div>
              <Toaster />
              <Sonner />
            </Router>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
