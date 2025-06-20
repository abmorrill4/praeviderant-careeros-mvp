
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

  const previewDataDeletion = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to preview data deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('test_user_deletion_dry_run', {
        target_user_id: user.id
      });

      if (error) {
        console.error('Error previewing data deletion:', error);
        throw error;
      }

      setDeletionPreview(data || []);
      return data;
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

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('handle_user_deletion', {
        target_user_id: user.id
      });

      if (error) {
        console.error('Error deleting user data:', error);
        throw error;
      }

      toast({
        title: "Data Deletion Complete",
        description: "Your data has been successfully deleted. You will be signed out.",
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
