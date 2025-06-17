
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FormData {
  name: string;
  email: string;
  title: string;
  status: string;
  industry: string;
  challenge: string;
  stage: string;
  beta: boolean;
}

export const useInterestSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitInterest = async (formData: FormData, onSuccess: () => void) => {
    setIsSubmitting(true);

    try {
      // First, save to database
      const { error: dbError } = await supabase
        .from('user_interest')
        .insert([formData]);

      if (dbError) {
        if (dbError.code === '23505') { // Unique constraint violation
          toast({
            title: "Already registered!",
            description: "Great news - we already have you down for early access! We'll be in touch as soon as it's ready.",
          });
          onSuccess();
          return;
        } else {
          throw dbError;
        }
      }

      // If database save successful, send confirmation email
      try {
        console.log('Calling send-interest-confirmation function with:', formData);
        
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-interest-confirmation', {
          body: formData
        });

        console.log('Email function response:', emailData, emailError);

        if (emailError) {
          console.error('Error sending confirmation email:', emailError);
          toast({
            title: "Registration successful!",
            description: "Your interest has been registered, but we couldn't send a confirmation email. We'll be in touch soon!",
          });
        } else {
          toast({
            title: "Interest registered!",
            description: "Thanks for your detailed information. Check your email for confirmation. We'll be in touch soon with early access.",
          });
        }
      } catch (emailError) {
        console.error('Error calling email function:', emailError);
        toast({
          title: "Registration successful!",
          description: "Your interest has been registered, but we couldn't send a confirmation email. We'll be in touch soon!",
        });
      }

      onSuccess();

    } catch (error) {
      console.error('Error registering interest:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitInterest,
  };
};
