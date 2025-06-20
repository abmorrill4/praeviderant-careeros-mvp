
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEncryption = () => {
  const { toast } = useToast();

  const encryptAndStore = async (text: string, userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('encrypt-data', {
        body: {
          text: text,
          user_id: userId
        }
      });

      if (error) {
        console.error('Encryption error:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error encrypting data:', error);
      toast({
        title: "Encryption Error",
        description: "Failed to encrypt sensitive data. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    encryptAndStore
  };
};
