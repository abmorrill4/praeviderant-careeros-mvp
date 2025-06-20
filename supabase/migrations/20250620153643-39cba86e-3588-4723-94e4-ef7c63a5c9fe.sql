
-- Create table for storing encrypted data
CREATE TABLE public.encrypted_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  encrypted_content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.encrypted_data ENABLE ROW LEVEL SECURITY;

-- Create policies for encrypted_data
CREATE POLICY "Users can view their own encrypted data" 
  ON public.encrypted_data 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own encrypted data" 
  ON public.encrypted_data 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encrypted data" 
  ON public.encrypted_data 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own encrypted data" 
  ON public.encrypted_data 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER encrypted_data_updated_at
  BEFORE UPDATE ON public.encrypted_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
