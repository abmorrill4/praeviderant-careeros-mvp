
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Edit3, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { useMergeReviewItems, useCreateMergeDecision } from '@/hooks/useMergeDecisions';
import { useUserConfirmedProfile } from '@/hooks/useResumeDiffs';
import type { MergeReviewItem } from '@/types/merge-decisions';

interface MergeReviewPanelProps {
  versionId: string;
}

interface ReviewItemProps {
  item: MergeReviewItem;
  confirmedValue?: string;
  onDecision: (
    parsedEntityId: string,
    decisionType: 'accept' | 'reject' | 'override',
    overrideValue?: string
  ) => void;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ item, confirmedValue, onDecision }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [overrideValue, setOverrideValue] = useState(item.parsedValue);

  const getDiffTypeColor = (diffType: string) => {
    switch (diffType) {
      case 'identical': return 'bg-green-100 text-green-800';
      case 'equivalent': return 'bg-blue-100 text-blue-800';
      case 'conflicting': return 'bg-red-100 text-red-800';
      case 'new': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiffTypeIcon = (diffType: string) => {
    switch (diffType) {
      case 'conflicting': return <AlertTriangle className="w-4 h-4" />;
      case 'new': return <Info className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleAccept = () => {
    onDecision(item.parsedEntityId, 'accept');
  };

  const handleReject = () => {
    onDecision(item.parsedEntityId, 'reject');
  };

  const handleOverride = () => {
    if (isEditing) {
      onDecision(item.parsedEntityId, 'override', overrideValue);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .split('.')
      .pop()
      ?.replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase()) || fieldName;
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{formatFieldName(item.fieldName)}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getDiffTypeColor(item.diffType)}>
              {getDiffTypeIcon(item.diffType)}
              <span className="ml-1">{item.diffType}</span>
            </Badge>
            <Badge variant="outline">
              {Math.round(item.confidenceScore * 100)}% confidence
            </Badge>
          </div>
        </div>
        {item.justification && (
          <CardDescription className="text-sm text-muted-foreground mt-2">
            {item.justification}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Current Profile Value */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Current Profile</h4>
            <div className="p-3 bg-muted rounded-lg min-h-[60px] flex items-center">
              {confirmedValue ? (
                <p className="text-sm">{confirmedValue}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No current value</p>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Parsed Resume Value */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">From Resume</h4>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg min-h-[60px] flex items-center">
              <p className="text-sm">{item.parsedValue}</p>
            </div>
          </div>
        </div>

        {/* Override Input */}
        {isEditing && (
          <div className="mb-4 space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Override Value</h4>
            {item.parsedValue.length > 100 ? (
              <Textarea
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                placeholder="Enter custom value..."
                className="min-h-[80px]"
              />
            ) : (
              <Input
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                placeholder="Enter custom value..."
              />
            )}
          </div>
        )}

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleAccept}
            size="sm"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
            Accept Parsed
          </Button>
          
          <Button
            onClick={handleReject}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
            Reject
          </Button>
          
          <Button
            onClick={handleOverride}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Edit3 className="w-4 h-4" />
            {isEditing ? 'Save Override' : 'Override'}
          </Button>
          
          {isEditing && (
            <Button
              onClick={() => setIsEditing(false)}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const MergeReviewPanel: React.FC<MergeReviewPanelProps> = ({ versionId }) => {
  const { data: reviewItems = [], isLoading: loadingItems } = useMergeReviewItems(versionId);
  const { data: confirmedProfile = [] } = useUserConfirmedProfile();
  const createDecisionMutation = useCreateMergeDecision();

  const handleDecision = async (
    parsedEntityId: string,
    decisionType: 'accept' | 'reject' | 'override',
    overrideValue?: string
  ) => {
    const item = reviewItems.find(item => item.parsedEntityId === parsedEntityId);
    if (!item) return;

    const confirmedValue = confirmedProfile.find(
      cp => cp.entity_type === item.profileEntityType && 
           cp.entity_id === item.profileEntityId &&
           cp.field_name === item.fieldName
    )?.confirmed_value || '';

    await createDecisionMutation.mutateAsync({
      versionId,
      parsedEntityId,
      profileEntityId: item.profileEntityId,
      profileEntityType: item.profileEntityType,
      fieldName: item.fieldName,
      decisionType,
      parsedValue: item.parsedValue,
      confirmedValue,
      overrideValue,
      justification: item.justification,
      confidenceScore: item.confidenceScore
    });
  };

  if (loadingItems) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p>Loading merge review items...</p>
        </CardContent>
      </Card>
    );
  }

  if (reviewItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Merge Review</CardTitle>
          <CardDescription>
            Review and validate changes before updating your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No items to review</p>
        </CardContent>
      </Card>
    );
  }

  // Group items by diff type for better organization
  const groupedItems = reviewItems.reduce((acc, item) => {
    if (!acc[item.diffType]) {
      acc[item.diffType] = [];
    }
    acc[item.diffType].push(item);
    return acc;
  }, {} as Record<string, MergeReviewItem[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merge Review</CardTitle>
        <CardDescription>
          Review and validate changes before updating your profile ({reviewItems.length} items)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {Object.entries(groupedItems).map(([diffType, items]) => (
            <div key={diffType} className="mb-6">
              <h3 className="font-semibold mb-3 capitalize">
                {diffType} Changes ({items.length})
              </h3>
              {items.map((item) => {
                const confirmedValue = confirmedProfile.find(
                  cp => cp.entity_type === item.profileEntityType && 
                       cp.entity_id === item.profileEntityId &&
                       cp.field_name === item.fieldName
                )?.confirmed_value;

                return (
                  <ReviewItem
                    key={item.parsedEntityId}
                    item={item}
                    confirmedValue={confirmedValue}
                    onDecision={handleDecision}
                  />
                );
              })}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
