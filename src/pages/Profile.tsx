
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Trash2, AlertTriangle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUserDeletion } from '@/hooks/useUserDeletion';
import { AIEnrichedProfileSection } from '@/components/profile/AIEnrichedProfileSection';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const { 
    isLoading, 
    deletionPreview, 
    previewDataDeletion, 
    deleteUserData 
  } = useUserDeletion();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreviewDeletion = async () => {
    try {
      await previewDataDeletion();
      setShowDeletionConfirm(true);
    } catch (error) {
      console.error('Error previewing deletion:', error);
    }
  };

  const handleConfirmDeletion = async () => {
    try {
      await deleteUserData();
      setShowDeletionConfirm(false);
    } catch (error) {
      console.error('Error deleting data:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please sign in to view your profile</p>
            <Button onClick={() => navigate('/auth')} className="mt-4">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-8">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Account Status</label>
                  <Badge variant="outline" className="ml-2">Active</Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSignOut} variant="outline">
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI-Enriched Profile Section */}
          <AIEnrichedProfileSection />

          {/* Data Management */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Manage your personal data and account deletion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Data Deletion:</strong> This will permanently delete all your data including 
                  resumes, AI analysis, career profiles, and account information. This action cannot be undone.
                </AlertDescription>
              </Alert>

              {!showDeletionConfirm ? (
                <div className="flex gap-2">
                  <Button 
                    onClick={handlePreviewDeletion}
                    variant="outline"
                    disabled={isLoading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Preview Data to Delete
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Data to be deleted:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {deletionPreview.map((item) => (
                        <div key={item.table_name} className="flex justify-between">
                          <span>{item.table_name}:</span>
                          <span className="font-medium">{item.rows_to_delete} records</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Final Warning:</strong> This will permanently delete all the data shown above. 
                      You will be signed out automatically after deletion.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleConfirmDeletion}
                      variant="destructive"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Deleting...' : 'Confirm Delete All Data'}
                    </Button>
                    <Button 
                      onClick={() => setShowDeletionConfirm(false)}
                      variant="outline"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
