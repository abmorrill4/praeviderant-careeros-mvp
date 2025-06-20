
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
    const { encrypted_id, user_id } = await req.json();
    
    if (!encrypted_id || !user_id) {
      throw new Error('Encrypted ID and user_id are required');
    }

    console.log('Decrypting data for user:', user_id);

    // Initialize Supabase client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Retrieve the encrypted data from the database
    const { data: encryptedData, error: fetchError } = await supabase
      .from('encrypted_data')
      .select('encrypted_content')
      .eq('id', encrypted_id)
      .eq('user_id', user_id)
      .single();

    if (fetchError) {
      console.error('Error fetching encrypted data:', fetchError);
      throw new Error(`Failed to fetch encrypted data: ${fetchError.message}`);
    }

    if (!encryptedData) {
      throw new Error('Encrypted data not found');
    }

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

    // Convert base64 back to bytes
    const combined = new Uint8Array(
      atob(encryptedData.encrypted_content)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 16);
    const encryptedBytes = combined.slice(16);

    // Import the key for AES-256-CBC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      cryptoKey,
      encryptedBytes
    );

    // Convert back to text
    const decryptedText = new TextDecoder().decode(decryptedData);

    console.log('Data decrypted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        decrypted_content: decryptedText 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in decrypt-data function:', error);
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
