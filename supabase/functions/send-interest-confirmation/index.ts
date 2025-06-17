
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
      from: "Praeviderant <noreply@praeviderant.com>",
      to: [email],
      subject: "Welcome to Praeviderant Early Access!",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: auto; padding: 32px; color: #1f2937; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; font-weight: bold;">Praeviderant</h1>
          </div>

          <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 16px; font-weight: 600;">Welcome ${name}!</h2>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #374151;">
            Thank you for joining our early access program. We're excited to have you on board as we build the future of career intelligence.
          </p>

          <div style="background: #f9fafb; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #374151; font-size: 14px;">
              <strong>What's next?</strong> We'll notify you as soon as early access becomes available. You'll be among the first to experience our AI-powered career platform.
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #374151;">
            In the meantime, feel free to reply to this email if you have any questions or feedback. We'd love to hear from you!
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <div style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: 600;">
              Early Access Reserved ✓
            </div>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px; text-align: center;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">
              © 2024 Praeviderant – Building the future of career development
            </p>
          </div>
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
