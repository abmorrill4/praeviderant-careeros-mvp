
-- Create invitations table to manage invitation codes
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_email TEXT,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired'))
);

-- Add RLS policies for invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations they created
CREATE POLICY "Users can view their own invitations" 
  ON public.invitations 
  FOR SELECT 
  USING (auth.uid() = invited_by);

-- Users can create invitations (but only their own)
CREATE POLICY "Users can create invitations" 
  ON public.invitations 
  FOR INSERT 
  WITH CHECK (auth.uid() = invited_by);

-- Users can update invitations they created
CREATE POLICY "Users can update their own invitations" 
  ON public.invitations 
  FOR UPDATE 
  USING (auth.uid() = invited_by);

-- Allow anyone to view invitations by code (needed for signup validation)
CREATE POLICY "Anyone can view invitations by code" 
  ON public.invitations 
  FOR SELECT 
  USING (true);

-- Create function to generate unique invitation codes
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.invitations WHERE invitations.code = code) INTO exists_check;
    
    -- Exit loop if code is unique
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Create function to mark expired invitations
CREATE OR REPLACE FUNCTION public.mark_expired_invitations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
    AND expires_at < now();
END;
$$;

-- Add invitation_code column to profiles table to track which invitation was used
ALTER TABLE public.profiles ADD COLUMN invitation_code TEXT REFERENCES public.invitations(code);

-- Create index for better performance
CREATE INDEX idx_invitations_code ON public.invitations(code);
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);
