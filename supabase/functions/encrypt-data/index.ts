
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, user_id } = await req.json();
    
    if (!text || !user_id) {
      throw new Error('Text and user_id are required');
    }

    console.log('Encrypting data for user:', user_id);

    // Get the encryption key from Supabase secrets
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('Encryption key not found in environment variables');
    }

    // Convert the key to bytes (assuming it's a hex string)
    const keyBytes = new Uint8Array(
      encryptionKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    if (keyBytes.length !== 32) {
      throw new Error('Encryption key must be exactly 32 bytes (64 hex characters)');
    }

    // Generate a random IV (initialization vector)
    const iv = crypto.getRandomValues(new Uint8Array(16));

    // Import the key for AES-256-CBC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    );

    // Convert text to bytes
    const textBytes = new TextEncoder().encode(text);

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv },
      cryptoKey,
      textBytes
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage
    const encryptedString = btoa(String.fromCharCode(...combined));

    // Initialize Supabase client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store the encrypted data in the database
    const { data: storedData, error: storageError } = await supabase
      .from('encrypted_data')
      .insert({
        user_id: user_id,
        encrypted_content: encryptedString,
        content_type: 'text',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (storageError) {
      console.error('Error storing encrypted data:', storageError);
      throw new Error(`Failed to store encrypted data: ${storageError.message}`);
    }

    console.log('Data encrypted and stored successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        encrypted_id: storedData.id,
        encrypted_content: encryptedString 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in encrypt-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
