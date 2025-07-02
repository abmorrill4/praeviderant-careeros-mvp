import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, User, Mail, Camera } from 'lucide-react';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';

interface ProfileCompletenessIndicatorProps {
  showDetails?: boolean;
  onImproveProfile?: () => void;
}

export const ProfileCompletenessIndicator: React.FC<ProfileCompletenessIndicatorProps> = ({
  showDetails = true,
  onImproveProfile,
}) => {
  const { data, loading, error, completionPercentage, isNewUser } = useProfileCompleteness();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-2 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center text-destructive">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">Unable to check profile completeness</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCompletionColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMissingFieldIcon = (field: string) => {
    switch (field) {
      case 'name': return <User className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'avatar': return <Camera className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getMissingFieldLabel = (field: string) => {
    switch (field) {
      case 'name': return 'Full Name';
      case 'email': return 'Email Address';
      case 'avatar': return 'Profile Picture';
      default: return field;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Profile Completeness</CardTitle>
          <Badge variant={completionPercentage >= 70 ? 'default' : 'secondary'}>
            {completionPercentage}%
          </Badge>
        </div>
        <CardDescription>
          {data?.message || 'Complete your profile to get better insights'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className={getCompletionColor(completionPercentage)}>
              {completionPercentage}% complete
            </span>
          </div>
          <Progress 
            value={completionPercentage} 
            className="h-2"
          />
        </div>

        {showDetails && data?.missing_fields && data.missing_fields.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Missing Information:</h4>
            <div className="space-y-2">
              {data.missing_fields.map((field) => (
                <div key={field} className="flex items-center gap-2 text-sm">
                  {getMissingFieldIcon(field)}
                  <span>{getMissingFieldLabel(field)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isNewUser && completionPercentage < 70 && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete your profile to unlock all features</span>
            </div>
            
            {onImproveProfile && (
              <Button 
                onClick={onImproveProfile}
                size="sm" 
                className="w-full"
              >
                Complete Profile
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};