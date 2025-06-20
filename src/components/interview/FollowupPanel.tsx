
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFollowupFlags } from '@/hooks/useFollowupFlags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Flag, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface FollowupPanelProps {
  sessionId: string | null;
  onSelectFollowup?: (followupId: string) => void;
}

const FollowupPanel = ({ sessionId, onSelectFollowup }: FollowupPanelProps) => {
  const { theme } = useTheme();
  const {
    followups,
    isLoading,
    listFollowups,
    resolveFollowup,
    getPriorityColor,
  } = useFollowupFlags(sessionId);

  useEffect(() => {
    if (sessionId) {
      listFollowups();
    }
  }, [sessionId, listFollowups]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-3 h-3" />;
      case 'medium': return <Clock className="w-3 h-3" />;
      case 'low': return <Flag className="w-3 h-3" />;
      default: return <Flag className="w-3 h-3" />;
    }
  };

  const handleResolve = async (followupId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await resolveFollowup(followupId);
  };

  if (!sessionId) {
    return null;
  }

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark/50 border-career-gray-dark/30' : 'bg-career-panel-light/50 border-career-gray-light/30'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-lg flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          <Flag className="w-5 h-5 text-career-accent" />
          Follow-ups ({followups.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-career-accent"></div>
          </div>
        ) : followups.length === 0 ? (
          <div className="text-center py-8">
            <Flag className={`w-8 h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
            <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              No follow-ups flagged yet
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {followups.map((followup) => (
                <div
                  key={followup.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-80 ${
                    theme === 'dark' 
                      ? 'bg-career-gray-dark/30 border-career-gray-dark/40 hover:bg-career-gray-dark/50' 
                      : 'bg-white border-career-gray-light/40 hover:bg-career-gray-light/20'
                  }`}
                  onClick={() => onSelectFollowup?.(followup.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-2 py-1 border ${getPriorityColor(followup.priority)}`}
                        >
                          {getPriorityIcon(followup.priority)}
                          <span className="ml-1 capitalize">{followup.priority}</span>
                        </Badge>
                        {followup.question_flows && (
                          <Badge variant="secondary" className="text-xs">
                            {followup.question_flows.phase}
                          </Badge>
                        )}
                      </div>
                      
                      <p className={`text-sm font-medium mb-1 truncate ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                        {followup.question_flows?.question_text || 'Question'}
                      </p>
                      
                      <p className={`text-xs ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                        {followup.reason}
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleResolve(followup.id, e)}
                      className="p-1 h-auto text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowupPanel;
