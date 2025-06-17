
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Invitation {
  id: string;
  code: string;
  invited_email: string | null;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
  created_at: string;
  status: 'pending' | 'used' | 'expired';
}

export const useInvitations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateInvitationCode = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { isValid: false, error: 'Invalid or expired invitation code' };
        }
        throw error;
      }

      return { isValid: true, invitation: data };
    } catch (error: any) {
      console.error('Error validating invitation code:', error);
      return { isValid: false, error: error.message };
    }
  };

  const markInvitationAsUsed = async (code: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'used',
          used_by: userId,
          used_at: new Date().toISOString()
        })
        .eq('code', code.toUpperCase());

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error marking invitation as used:', error);
      return { success: false, error: error.message };
    }
  };

  const createInvitation = async (invitedEmail?: string) => {
    setLoading(true);
    try {
      // Generate invitation code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_invitation_code');

      if (codeError) throw codeError;

      // Create invitation record
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          code: codeData,
          invited_email: invitedEmail || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Invitation created successfully",
        description: `Invitation code: ${data.code}`,
      });

      return { success: true, invitation: data };
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Failed to create invitation",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getMyInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, invitations: data };
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    loading,
    validateInvitationCode,
    markInvitationAsUsed,
    createInvitation,
    getMyInvitations,
  };
};
