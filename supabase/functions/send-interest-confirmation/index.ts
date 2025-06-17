
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0;">Praeviderant</h1>
            <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0 0;">Career Intelligence Platform</p>
          </div>
          
          <h2 style="color: #111827; font-size: 24px; margin-bottom: 20px;">Thank you for your interest, ${name}!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            We're excited to have you join our early access program. Your application has been received and we'll be reviewing it shortly.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Your Registration Details:</h3>
            <ul style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              ${title ? `<li><strong>Current Title:</strong> ${title}</li>` : ''}
              ${status ? `<li><strong>Current Status:</strong> ${status}</li>` : ''}
              ${industry ? `<li><strong>Industry:</strong> ${industry}</li>` : ''}
              ${stage ? `<li><strong>Career Stage:</strong> ${stage}</li>` : ''}
              ${beta ? '<li><strong>Beta Testing:</strong> Yes, I\'m interested</li>' : ''}
            </ul>
          </div>
          
          ${challenge ? `
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1d4ed8; font-size: 18px; margin: 0 0 15px 0;">Your Career Challenge:</h3>
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0; font-style: italic;">"${challenge}"</p>
            </div>
          ` : ''}
          
          <div style="margin: 30px 0;">
            <h3 style="color: #111827; font-size: 18px; margin-bottom: 15px;">What's Next?</h3>
            <ol style="color: #374151; font-size: 14px; line-height: 1.6; padding-left: 20px;">
              <li>We'll review your application within 2-3 business days</li>
              <li>Priority access will be granted based on your profile and needs</li>
              <li>You'll receive an email with your access credentials when ready</li>
              <li>Early access users get to influence our development roadmap</li>
            </ol>
          </div>
          
          <div style="background-color: #065f46; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <h3 style="margin: 0 0 10px 0; font-size: 18px;">Ready to Transform Your Career?</h3>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">
              Praeviderant uses AI to understand your complete career story, not just resume bullets.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © 2024 Praeviderant. Building the future of career development.
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0 0;">
              If you have any questions, feel free to reply to this email.
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
