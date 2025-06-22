
-- Enable Row Level Security on all entity tables
ALTER TABLE public.work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification ENABLE ROW LEVEL SECURITY;

-- career_profile should already have RLS enabled, but let's make sure
ALTER TABLE public.career_profile ENABLE ROW LEVEL SECURITY;
