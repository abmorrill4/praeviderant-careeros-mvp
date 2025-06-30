
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Trash2, 
  AlertTriangle, 
  FileText, 
  Eye,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useUserDeletion } from '@/hooks/useUserDeletion';
import { useResumeStreams } from '@/hooks/useResumeStreams';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const DataManagementTab: React.FC = () => {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [isDeletingResumes, setIsDeletingResumes] = useState(false);
  
  const { 
    isLoading: isDeletionLoading, 
    deletionPreview, 
    previewDataDeletion, 
    deleteUserData 
  } = useUserDeletion();

  const { data: streams, isLoading: streamsLoading } = useResumeStreams();

  const handlePreviewDeletion = async () => {
    try {
      await previewDataDeletion();
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing deletion:', error);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!confirmingDeletion) {
      setConfirmingDeletion(true);
      return;
    }

    try {
      await deleteUserData();
      setConfirmingDeletion(false);
      setShowPreview(false);
    } catch (error) {
      console.error('Error deleting data:', error);
      setConfirmingDeletion(false);
    }
  };

  const handleDeleteAllResumes = async () => {
    if (!streams || streams.length === 0) {
      toast({
        title: "No Resumes Found",
        description: "You don't have any uploaded resumes to delete.",
      });
      return;
    }

    setIsDeletingResumes(true);
    try {
      // Delete all resume streams for the user
      const { error } = await supabase.functions.invoke('resume-stream-operations', {
        body: { operation: 'delete_all_user_streams' }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Resumes Deleted",
        description: `Successfully deleted all ${streams.length} resume collections and their versions.`,
      });
    } catch (error) {
      console.error('Error deleting resumes:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete resume collections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingResumes(false);
    }
  };

  const totalDataRows = deletionPreview.reduce((sum, item) => sum + item.rows_to_delete, 0);
  const totalResumeStreams = streams?.length || 0;
  const totalResumeVersions = streams?.reduce((sum, stream) => sum + (stream.resume_versions?.length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-career-text">
          Data Management
        </h3>
        <p className="text-sm text-career-text-muted">
          Manage your personal data, uploaded resumes, and privacy settings
        </p>
      </div>

      {/* Resume Data Management */}
      <Card className="bg-career-panel border-career-text/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-career-text">
            <FileText className="w-5 h-5" />
            Resume Collections
          </CardTitle>
          <CardDescription className="text-career-text-muted">
            Manage all your uploaded resumes and their versions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {totalResumeStreams} Collections
                </Badge>
                <Badge variant="outline">
                  {totalResumeVersions} Total Versions
                </Badge>
              </div>
              <p className="text-sm text-career-text-muted">
                {streamsLoading ? 'Loading resume data...' : 
                 totalResumeStreams === 0 ? 'No uploaded resumes found' :
                 `You have ${totalResumeStreams} resume collection${totalResumeStreams !== 1 ? 's' : ''} with ${totalResumeVersions} total version${totalResumeVersions !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteAllResumes}
              disabled={isDeletingResumes || streamsLoading || totalResumeStreams === 0}
              className="flex items-center gap-2"
            >
              {isDeletingResumes ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete All Resumes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Data Management */}
      <Card className="bg-career-panel border-career-text/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-career-text">
            <Database className="w-5 h-5" />
            Complete Data Deletion
          </CardTitle>
          <CardDescription className="text-career-text-muted">
            Permanently delete all your profile data and account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action will permanently delete ALL your data including profile information, 
              work experience, education, skills, interview transcripts, and uploaded resumes. 
              This cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePreviewDeletion}
              disabled={isDeletionLoading}
              className="flex items-center gap-2"
            >
              {isDeletionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              Preview Data to Delete
            </Button>

            {showPreview && (
              <Button
                variant="destructive"
                onClick={handleConfirmDeletion}
                disabled={isDeletionLoading}
                className="flex items-center gap-2"
              >
                {isDeletionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : confirmingDeletion ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {confirmingDeletion ? 'Confirm Complete Deletion' : 'Delete All Data'}
              </Button>
            )}
          </div>

          {showPreview && deletionPreview.length > 0 && (
            <div className="mt-4 space-y-3">
              <Separator />
              <div>
                <h4 className="font-medium mb-3 text-career-text">
                  Data Deletion Preview ({totalDataRows} total records)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {deletionPreview.map((item, index) => (
                    <div
                      key={index}
                      className="p-2 rounded border border-career-gray bg-career-gray/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-career-text">
                          {item.table_name.replace(/_/g, ' ')}
                        </span>
                        <Badge variant={item.rows_to_delete > 0 ? "destructive" : "secondary"}>
                          {item.rows_to_delete}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
