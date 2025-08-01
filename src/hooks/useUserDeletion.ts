
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface DeletionPreview {
  table_name: string;
  rows_to_delete: number;
}

interface DeletionResult {
  table_name: string;
  rows_deleted: number;
}

export const useUserDeletion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview[]>([]);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const previewDataDeletion = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to preview data deletion.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting data deletion preview for user:', user.id);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('test_user_deletion_dry_run', {
        target_user_id: user.id
      });

      console.log('Preview data response:', data);
      console.log('Preview error:', error);

      if (error) {
        console.error('Error previewing data deletion:', error);
        toast({
          title: "Preview Error",
          description: `Failed to preview data deletion: ${error.message}`,
          variant: "destructive",
        });
        throw error;
      }

      // Transform the data to match our interface
      const previewData = (data || []).map((item: any) => ({
        table_name: item.table_name,
        rows_to_delete: Number(item.rows_to_delete)
      }));

      console.log('Transformed preview data:', previewData);
      setDeletionPreview(previewData);
      
      toast({
        title: "Preview Complete",
        description: `Found data across ${previewData.length} tables to review.`,
      });

      return previewData;
    } catch (error: any) {
      console.error('Error previewing data deletion:', error);
      toast({
        title: "Preview Error",
        description: "Failed to preview data deletion. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUserData = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to delete your data.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting data deletion for user:', user.id);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('handle_user_deletion', {
        target_user_id: user.id
      });

      console.log('Deletion data response:', data);
      console.log('Deletion error:', error);

      if (error) {
        console.error('Error deleting user data:', error);
        toast({
          title: "Deletion Error",
          description: `Failed to delete your data: ${error.message}`,
          variant: "destructive",
        });
        throw error;
      }

      const totalDeleted = (data || []).reduce((sum: number, item: any) => sum + Number(item.rows_deleted), 0);

      // Clear all React Query caches to ensure UI reflects the deletion
      console.log('Clearing all React Query caches...');
      queryClient.clear();
      
      // Also specifically invalidate entity queries
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['latest-entities'] });
      queryClient.invalidateQueries({ queryKey: ['resume-streams'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });

      toast({
        title: "Data Deletion Complete",
        description: `Successfully deleted ${totalDeleted} records across ${data?.length || 0} tables. You will be signed out.`,
        variant: "default",
      });

      // Sign out the user after successful deletion
      setTimeout(async () => {
        await signOut();
      }, 2000);

      return data;
    } catch (error: any) {
      console.error('Error deleting user data:', error);
      toast({
        title: "Deletion Error",
        description: "Failed to delete your data. Please try again or contact support.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    deletionPreview,
    previewDataDeletion,
    deleteUserData,
  };
};
