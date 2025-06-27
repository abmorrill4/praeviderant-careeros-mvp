
-- Add narrative context field to the skill table
ALTER TABLE public.skill 
ADD COLUMN narrative_context TEXT;
