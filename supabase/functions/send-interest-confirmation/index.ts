
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InterestConfirmationRequest {
  name: string;
  email: string;
  title?: string;
  status?: string;
  industry?: string;
  challenge?: string;
  stage?: string;
  beta: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, title, status, industry, challenge, stage, beta }: InterestConfirmationRequest = await req.json();

    console.log(`Sending confirmation email to: ${email} for user: ${name}`);

    const emailResponse = await resend.emails.send({
      from: "Praeviderant <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Praeviderant Early Access!",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #111827; background: #ffffff;">
          <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 12px;">Thanks for Registering, ${name}!</h1>

          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            We're glad you're interested in what we're building. You're officially on the early access list.
          </p>

          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            We'll follow up when access becomes available — and you'll be among the first to try it out.
          </p>

          <p style="font-size: 14px; line-height: 1.5; color: #6b7280;">
            Until then, keep an eye on your inbox. If you have any questions, just reply to this email.
          </p>

          <p style="font-size: 12px; color: #9ca3af; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
            © 2024 Praeviderant – Building the future of career development.
          </p>
        </div>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      message: "Confirmation email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-interest-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: "Failed to send confirmation email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
