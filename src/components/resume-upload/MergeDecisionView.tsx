
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  ArrowRight,
  User,
  FileText,
  Save,
  Loader2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useMergeReviewItems, useCreateMergeDecision } from '@/hooks/useMergeDecisions';
import { useUserConfirmedProfile } from '@/hooks/useResumeDiffs';
import { useApplyMergeDecisions } from '@/hooks/useApplyMergeDecisions';
import { useApplyResumeDataToProfile } from '@/hooks/useApplyResumeDataToProfile';
import { parseResumeFieldValue, getFieldDisplayName } from '@/utils/resumeDataParser';
import { DataRenderer, ConfidenceBadge } from './DataRenderers';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { MergeReviewItem } from '@/types/merge-decisions';

interface MergeDecisionViewProps {
  versionId: string;
  onProfileUpdated?: () => void;
}

interface MergeDecisionState {
  [key: string]: {
    decision: 'accept' | 'reject' | 'override' | null;
    overrideValue?: string;
    justification?: string;
  };
}

export const MergeDecisionView: React.FC<MergeDecisionViewProps> = ({ 
  versionId, 
  onProfileUpdated 
}) => {
  const { data: reviewItems, isLoading: reviewLoading, refetch: refetchReviewItems } = useMergeReviewItems(versionId);
  const { data: confirmedProfile } = useUserConfirmedProfile();
  const createDecisionMutation = useCreateMergeDecision();
  const applyDecisionsMutation = useApplyMergeDecisions();
  const applyResumeDataMutation = useApplyResumeDataToProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [decisions, setDecisions] = useState<MergeDecisionState>({});
  const [showOverrideInput, setShowOverrideInput] = useState<{ [key: string]: boolean }>({});

  const refreshProfileData = () => {
    // Invalidate all profile-related queries to force refresh
    queryClient.invalidateQueries({ queryKey: ['entities'] });
    queryClient.invalidateQueries({ queryKey: ['user-confirmed-profile'] });
    
    // Specifically refresh each entity type
    const entityTypes = ['work_experience', 'education', 'skill', 'project', 'certification'];
    entityTypes.forEach(entityType => {
      queryClient.invalidateQueries({ queryKey: ['entities', entityType, user?.id] });
    });
    
    // Notify parent component
    onProfileUpdated?.();
  };

  async function handleApplyAllResumeData() {
    try {
      console.log('Starting to apply all resume data for version:', versionId);
      
      const result = await applyResumeDataMutation.mutateAsync({ versionId });
      
      console.log('Apply resume data result:', result);
      
      toast({
        title: "Resume Data Applied Successfully",
        description: `Added ${result.entitiesCreated} new entities to your profile${result.errors > 0 ? ` (${result.errors} errors occurred)` : ''}`,
        variant: result.errors > 0 ? "destructive" : "default",
      });
      
      // Force refresh of profile data
      refreshProfileData();
      
      // Refetch review items to update the UI
      refetchReviewItems();
    } catch (error) {
      console.error('Error applying resume data:', error);
      toast({
        title: "Error Applying Resume Data",
        description: error instanceof Error ? error.message : "Failed to apply resume data to profile. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (reviewLoading) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-sm text-muted-foreground">Loading merge review...</span>
        </div>
      </div>
    );
  }

  // Show simple "Add All Data" option if no conflicts or the user just wants to get things working
  return (
    <div className="space-y-6">
      {/* Quick Add All Data Card */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Plus className="w-5 h-5" />
            Quick Setup: Add All Resume Data
          </CardTitle>
          <CardDescription>
            The fastest way to get your resume data into your profile. This will add all extracted information directly to your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={handleApplyAllResumeData}
              disabled={applyResumeDataMutation.isPending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {applyResumeDataMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add All Resume Data to Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => refetchReviewItems()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Analysis
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This will create new entries in your profile for work experience, education, skills, projects, and certifications found in your resume.
          </p>
        </CardContent>
      </Card>

      {reviewItems && reviewItems.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Detailed Review Available
              </CardTitle>
              <CardDescription>
                Found {reviewItems.length} items that could be reviewed for conflicts or duplicates. 
                You can use the "Add All Resume Data" button above for a quick setup, or expand this section for detailed review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>The detailed merge review workflow is available but optional. Most users can skip this and use the quick setup above.</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
