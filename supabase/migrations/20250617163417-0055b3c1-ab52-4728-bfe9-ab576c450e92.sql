
-- First, let's see what duplicates exist
-- Remove duplicate entries, keeping only the most recent one for each email
DELETE FROM public.user_interest 
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id 
  FROM public.user_interest 
  ORDER BY email, created_at DESC
);

-- Now add the unique constraint
ALTER TABLE public.user_interest ADD CONSTRAINT user_interest_email_unique UNIQUE (email);
