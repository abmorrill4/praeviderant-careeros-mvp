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

  if (reviewLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">Loading merge review...</div>
      </div>
    );
  }

  if (!reviewItems || reviewItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            No Conflicts Found
          </CardTitle>
          <CardDescription>
            All extracted data appears to be new or matches your existing profile perfectly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={handleApplyAllResumeData}
              disabled={applyResumeDataMutation.isPending}
              className="flex items-center gap-2"
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
        </CardContent>
      </Card>
    );
  }

  // Group items by conflict type
  const conflictingItems = reviewItems.filter(item => item.diffType === 'conflicting');
  const newItems = reviewItems.filter(item => item.diffType === 'new');
  const equivalentItems = reviewItems.filter(item => item.diffType === 'equivalent');

  const handleDecision = (itemKey: string, decision: 'accept' | 'reject' | 'override') => {
    setDecisions(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        decision
      }
    }));

    if (decision === 'override') {
      setShowOverrideInput(prev => ({ ...prev, [itemKey]: true }));
    } else {
      setShowOverrideInput(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const handleOverrideValue = (itemKey: string, value: string) => {
    setDecisions(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        overrideValue: value
      }
    }));
  };

  const handleSaveDecision = async (item: MergeReviewItem) => {
    const itemKey = `${item.fieldName}-${item.parsedEntityId}`;
    const decision = decisions[itemKey];
    
    if (!decision?.decision) return;

    try {
      await createDecisionMutation.mutateAsync({
        versionId,
        parsedEntityId: item.parsedEntityId,
        profileEntityId: item.profileEntityId,
        profileEntityType: item.profileEntityType,
        fieldName: item.fieldName,
        decisionType: decision.decision,
        parsedValue: item.parsedValue,
        confirmedValue: decision.decision === 'override' ? decision.overrideValue || item.parsedValue : item.parsedValue,
        overrideValue: decision.overrideValue,
        justification: decision.justification || item.justification,
        confidenceScore: item.confidenceScore
      });

      // Clear the decision from local state
      setDecisions(prev => {
        const newState = { ...prev };
        delete newState[itemKey];
        return newState;
      });
    } catch (error) {
      console.error('Error saving merge decision:', error);
    }
  };

  const handleApplyAllDecisions = async () => {
    try {
      const result = await applyDecisionsMutation.mutateAsync({ versionId });
      
      toast({
        title: "Decisions Applied Successfully",
        description: `Applied ${result.applied} decisions, rejected ${result.rejected}, overridden ${result.overridden}`,
      });
      
      // Clear all local decisions
      setDecisions({});
      setShowOverrideInput({});
      
      // Force refresh of profile data
      refreshProfileData();
    } catch (error) {
      console.error('Error applying decisions:', error);
      toast({
        title: "Error Applying Decisions",
        description: "Failed to apply merge decisions. Please try again.",
        variant: "destructive",
      });
    }
  };

  async function handleApplyAllResumeData() {
    try {
      console.log('Starting to apply all resume data for version:', versionId);
      
      const result = await applyResumeDataMutation.mutateAsync({ versionId });
      
      console.log('Apply resume data result:', result);
      
      toast({
        title: "Resume Data Applied Successfully",
        description: `Added ${result.entitiesCreated} new entities to your profile`,
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

  const renderMergeItem = (item: MergeReviewItem) => {
    const itemKey = `${item.fieldName}-${item.parsedEntityId}`;
    const decision = decisions[itemKey];
    const parsedData = parseResumeFieldValue(item.parsedValue);
    const displayName = getFieldDisplayName(item.fieldName);

    // Find existing confirmed value
    const existingValue = confirmedProfile?.find(
      p => p.field_name === item.fieldName && p.entity_id === item.profileEntityId
    )?.confirmed_value;

    const getConflictIcon = () => {
      switch (item.diffType) {
        case 'conflicting':
          return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        case 'new':
          return <FileText className="w-4 h-4 text-blue-500" />;
        case 'equivalent':
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        default:
          return <FileText className="w-4 h-4 text-gray-500" />;
      }
    };

    const getConflictColor = () => {
      switch (item.diffType) {
        case 'conflicting':
          return 'border-yellow-200 bg-yellow-50';
        case 'new':
          return 'border-blue-200 bg-blue-50';
        case 'equivalent':
          return 'border-green-200 bg-green-50';
        default:
          return 'border-gray-200 bg-gray-50';
      }
    };

    return (
      <Card key={itemKey} className={`${getConflictColor()}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            {getConflictIcon()}
            {displayName}
            <Badge variant="outline" className="text-xs">
              {item.diffType.replace('_', ' ')}
            </Badge>
          </CardTitle>
          <CardDescription>
            {item.justification}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Existing Value */}
            {existingValue && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-sm">Your Current Profile</span>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <span className="text-sm">{existingValue}</span>
                </div>
              </div>
            )}

            {/* Parsed Value */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">From Resume</span>
                <ConfidenceBadge score={item.confidenceScore} />
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <DataRenderer 
                  fieldName={item.fieldName}
                  parsedData={parsedData}
                  confidence={item.confidenceScore}
                />
              </div>
            </div>
          </div>

          {/* Decision Buttons */}
          {!decision?.decision && (
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecision(itemKey, 'accept')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-3 h-3" />
                Accept Resume Value
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecision(itemKey, 'reject')}
                className="flex items-center gap-2"
              >
                <XCircle className="w-3 h-3" />
                Keep Current
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecision(itemKey, 'override')}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-3 h-3" />
                Override
              </Button>
            </div>
          )}

          {/* Override Input */}
          {showOverrideInput[itemKey] && (
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Custom Value:</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="Enter your preferred value..."
                value={decision?.overrideValue || ''}
                onChange={(e) => handleOverrideValue(itemKey, e.target.value)}
              />
            </div>
          )}

          {/* Save Decision */}
          {decision?.decision && (
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRight className="w-3 h-3" />
                Will {decision.decision} this value
              </div>
              <Button
                onClick={() => handleSaveDecision(item)}
                disabled={createDecisionMutation.isPending}
                size="sm"
              >
                Save Decision
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Apply All Decisions Button */}
      {reviewItems.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Merge Decisions</h3>
            <p className="text-sm text-muted-foreground">
              Review conflicts and apply decisions to update your profile
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleApplyAllResumeData}
              disabled={applyResumeDataMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              {applyResumeDataMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add All New Data
            </Button>
            <Button
              onClick={handleApplyAllDecisions}
              disabled={applyDecisionsMutation.isPending}
              className="flex items-center gap-2"
              size="lg"
            >
              {applyDecisionsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Apply All Decisions to Profile
            </Button>
          </div>
        </div>
      )}

      {conflictingItems.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-yellow-700 mb-2">
              Conflicts Found ({conflictingItems.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              These values differ from your existing profile. Please review and decide what to keep.
            </p>
          </div>
          {conflictingItems.map(renderMergeItem)}
        </div>
      )}

      {newItems.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">
              New Information ({newItems.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              These are new data points not found in your existing profile.
            </p>
          </div>
          {newItems.map(renderMergeItem)}
        </div>
      )}

      {equivalentItems.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Matching Data ({equivalentItems.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              These values match or are equivalent to your existing profile.
            </p>
          </div>
          {equivalentItems.slice(0, 3).map(renderMergeItem)}
          {equivalentItems.length > 3 && (
            <div className="text-center">
              <Button variant="ghost" size="sm">
                Show {equivalentItems.length - 3} more matching items
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
