
import { useTheme } from '@/contexts/ThemeContext';
import { useProfileDeltas } from '@/hooks/useProfileDeltas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, Briefcase, User, Building } from 'lucide-react';

interface ProfileDeltaReviewProps {
  userId: string;
}

const ProfileDeltaReview = ({ userId }: ProfileDeltaReviewProps) => {
  const { theme } = useTheme();
  const { deltas, isLoading, updateDeltaStatus } = useProfileDeltas(userId);

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'job':
        return <Briefcase className="h-4 w-4" />;
      case 'summary':
        return <User className="h-4 w-4" />;
      case 'current_title':
      case 'current_company':
        return <Building className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const formatValue = (value: string | null, entityType: string, field: string | null) => {
    if (!value) return 'None';
    
    if (entityType === 'job' && field === 'new_job') {
      try {
        const job = JSON.parse(value);
        return `${job.title} at ${job.company}${job.start_date ? ` (${job.start_date})` : ''}`;
      } catch {
        return value;
      }
    }
    
    return value.length > 100 ? `${value.substring(0, 100)}...` : value;
  };

  const unresolvedDeltas = deltas.filter(delta => delta.status === 'unresolved');

  if (isLoading) {
    return (
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deltas.length === 0) {
    return (
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardContent className="p-6 text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            No profile changes detected yet. Complete an interview to see suggested updates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          Profile Changes Review
        </h3>
        {unresolvedDeltas.length > 0 && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            {unresolvedDeltas.length} pending
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {deltas.map((delta) => (
          <Card key={delta.id} className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getEntityIcon(delta.entity_type)}
                  <CardTitle className="text-sm">
                    {delta.entity_type === 'job' && delta.field === 'new_job' 
                      ? 'New Job Detected'
                      : `${delta.entity_type.replace('_', ' ')} Update`
                    }
                  </CardTitle>
                </div>
                <Badge className={getStatusColor(delta.status)}>
                  {delta.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {delta.original_value && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Original:</p>
                    <p className="text-sm">{formatValue(delta.original_value, delta.entity_type, delta.field)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {delta.original_value ? 'New:' : 'Detected:'}
                  </p>
                  <p className="text-sm">{formatValue(delta.new_value, delta.entity_type, delta.field)}</p>
                </div>
              </div>

              {delta.status === 'unresolved' && (
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => updateDeltaStatus(delta.id, 'approved')}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateDeltaStatus(delta.id, 'rejected')}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProfileDeltaReview;
