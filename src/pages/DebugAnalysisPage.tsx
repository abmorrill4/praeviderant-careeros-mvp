
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DebugDashboard } from '@/components/debug/DebugDashboard';

export default function DebugAnalysisPage() {
  const { versionId } = useParams<{ versionId?: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile-management')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile Management
          </Button>
        </div>

        <DebugDashboard versionId={versionId} />
      </div>
    </div>
  );
}
