
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useDecryption = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const decryptData = async (encryptedId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to decrypt data');
    }

    try {
      const { data, error } = await supabase.functions.invoke('decrypt-data', {
        body: {
          encrypted_id: encryptedId,
          user_id: user.id
        }
      });

      if (error) {
        console.error('Decryption error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error('Failed to decrypt data');
      }

      return data.decrypted_content;
    } catch (error: any) {
      console.error('Error decrypting data:', error);
      toast({
        title: "Decryption Error",
        description: "Failed to decrypt sensitive data. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    decryptData
  };
};
