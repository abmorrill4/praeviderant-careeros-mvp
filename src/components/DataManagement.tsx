
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, Trash2, Eye, RefreshCw } from 'lucide-react';
import { useUserDeletion } from '@/hooks/useUserDeletion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export const DataManagement = () => {
  const { user } = useAuth();
  const { isLoading, deletionPreview, previewDataDeletion, deleteUserData } = useUserDeletion();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handlePreview = async () => {
    console.log('Preview button clicked, user:', user?.id);
    try {
      await previewDataDeletion();
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const handleDelete = async () => {
    if (confirmationText !== 'DELETE MY DATA') {
      return;
    }
    await deleteUserData();
    setShowConfirmation(false);
    setConfirmationText('');
  };

  const totalRowsToDelete = deletionPreview.reduce((sum, item) => sum + item.rows_to_delete, 0);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Please log in to manage your data
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your personal data and exercise your right to data deletion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Data deletion is permanent and cannot be undone. 
              This will remove all your career data, interviews, and profile information.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Preview Data Deletion</h3>
              <p className="text-sm text-muted-foreground mb-4">
                See what data will be deleted from your account before proceeding.
              </p>
              <Button 
                onClick={handlePreview} 
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading Preview...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Preview Deletion
                  </>
                )}
              </Button>
            </div>

            {deletionPreview.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  Deletion Preview
                  <Badge variant="secondary">{totalRowsToDelete} total records</Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {deletionPreview.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium capitalize">
                        {item.table_name.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={item.rows_to_delete > 0 ? "destructive" : "secondary"}>
                        {item.rows_to_delete} records
                      </Badge>
                    </div>
                  ))}
                </div>
                {totalRowsToDelete === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No data found to delete. Your account appears to be empty.</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2 text-destructive">Delete All Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete all your data from Praeviderant. This action cannot be undone.
              </p>
              
              <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete All My Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Career profile and work history</li>
                        <li>Interview sessions and transcripts</li>
                        <li>Education and skill records</li>
                        <li>Projects and certifications</li>
                        <li>All encrypted personal data</li>
                      </ul>
                      <div className="mt-4 p-3 bg-destructive/10 rounded border">
                        <p className="text-sm font-medium">
                          To confirm, type <strong>"DELETE MY DATA"</strong> in the box below:
                        </p>
                        <input
                          type="text"
                          value={confirmationText}
                          onChange={(e) => setConfirmationText(e.target.value)}
                          className="mt-2 w-full p-2 border rounded text-sm"
                          placeholder="Type DELETE MY DATA"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                      setShowConfirmation(false);
                      setConfirmationText('');
                    }}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={confirmationText !== 'DELETE MY DATA' || isLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isLoading ? 'Deleting...' : 'Delete My Data'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
