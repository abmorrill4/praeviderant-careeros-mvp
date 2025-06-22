
-- Add RLS policies for work_experience table (with IF NOT EXISTS checks)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_experience' AND policyname = 'Users can view their own work experience') THEN
    CREATE POLICY "Users can view their own work experience" 
      ON public.work_experience 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_experience' AND policyname = 'Users can create their own work experience') THEN
    CREATE POLICY "Users can create their own work experience" 
      ON public.work_experience 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_experience' AND policyname = 'Users can update their own work experience') THEN
    CREATE POLICY "Users can update their own work experience" 
      ON public.work_experience 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_experience' AND policyname = 'Users can delete their own work experience') THEN
    CREATE POLICY "Users can delete their own work experience" 
      ON public.work_experience 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add RLS policies for education table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education' AND policyname = 'Users can view their own education') THEN
    CREATE POLICY "Users can view their own education" 
      ON public.education 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education' AND policyname = 'Users can create their own education') THEN
    CREATE POLICY "Users can create their own education" 
      ON public.education 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education' AND policyname = 'Users can update their own education') THEN
    CREATE POLICY "Users can update their own education" 
      ON public.education 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education' AND policyname = 'Users can delete their own education') THEN
    CREATE POLICY "Users can delete their own education" 
      ON public.education 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add RLS policies for skill table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill' AND policyname = 'Users can view their own skills') THEN
    CREATE POLICY "Users can view their own skills" 
      ON public.skill 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill' AND policyname = 'Users can create their own skills') THEN
    CREATE POLICY "Users can create their own skills" 
      ON public.skill 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill' AND policyname = 'Users can update their own skills') THEN
    CREATE POLICY "Users can update their own skills" 
      ON public.skill 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill' AND policyname = 'Users can delete their own skills') THEN
    CREATE POLICY "Users can delete their own skills" 
      ON public.skill 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add RLS policies for project table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project' AND policyname = 'Users can view their own projects') THEN
    CREATE POLICY "Users can view their own projects" 
      ON public.project 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project' AND policyname = 'Users can create their own projects') THEN
    CREATE POLICY "Users can create their own projects" 
      ON public.project 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project' AND policyname = 'Users can update their own projects') THEN
    CREATE POLICY "Users can update their own projects" 
      ON public.project 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project' AND policyname = 'Users can delete their own projects') THEN
    CREATE POLICY "Users can delete their own projects" 
      ON public.project 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add RLS policies for certification table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certification' AND policyname = 'Users can view their own certifications') THEN
    CREATE POLICY "Users can view their own certifications" 
      ON public.certification 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certification' AND policyname = 'Users can create their own certifications') THEN
    CREATE POLICY "Users can create their own certifications" 
      ON public.certification 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certification' AND policyname = 'Users can update their own certifications') THEN
    CREATE POLICY "Users can update their own certifications" 
      ON public.certification 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certification' AND policyname = 'Users can delete their own certifications') THEN
    CREATE POLICY "Users can delete their own certifications" 
      ON public.certification 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Skip career_profile policies since they already exist
-- The career_profile table already has RLS policies configured
