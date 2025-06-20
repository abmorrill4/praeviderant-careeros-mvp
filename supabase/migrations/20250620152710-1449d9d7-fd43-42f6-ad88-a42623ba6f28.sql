
-- Migration: Add versioning and tracking columns to entity tables
-- This script adds logical_entity_id, version, is_active, source, and source_confidence columns
-- and creates composite primary keys for WorkExperience, Education, Skill, Project, and Certification tables

-- Create WorkExperience table if it doesn't exist and add versioning columns
CREATE TABLE IF NOT EXISTS public.work_experience (
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT,
  source_confidence FLOAT,
  user_id UUID NOT NULL,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (logical_entity_id, version)
);

-- Create Education table if it doesn't exist and add versioning columns
CREATE TABLE IF NOT EXISTS public.education (
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT,
  source_confidence FLOAT,
  user_id UUID NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_date TEXT,
  end_date TEXT,
  gpa TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (logical_entity_id, version)
);

-- Create Skill table if it doesn't exist and add versioning columns
CREATE TABLE IF NOT EXISTS public.skill (
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT,
  source_confidence FLOAT,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  proficiency_level TEXT,
  years_of_experience INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (logical_entity_id, version)
);

-- Create Project table if it doesn't exist and add versioning columns
CREATE TABLE IF NOT EXISTS public.project (
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT,
  source_confidence FLOAT,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  technologies_used TEXT[],
  start_date TEXT,
  end_date TEXT,
  project_url TEXT,
  repository_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (logical_entity_id, version)
);

-- Create Certification table if it doesn't exist and add versioning columns
CREATE TABLE IF NOT EXISTS public.certification (
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT,
  source_confidence FLOAT,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date TEXT,
  expiration_date TEXT,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (logical_entity_id, version)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_work_experience_user_id ON public.work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_work_experience_is_active ON public.work_experience(is_active);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON public.education(user_id);
CREATE INDEX IF NOT EXISTS idx_education_is_active ON public.education(is_active);
CREATE INDEX IF NOT EXISTS idx_skill_user_id ON public.skill(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_is_active ON public.skill(is_active);
CREATE INDEX IF NOT EXISTS idx_project_user_id ON public.project(user_id);
CREATE INDEX IF NOT EXISTS idx_project_is_active ON public.project(is_active);
CREATE INDEX IF NOT EXISTS idx_certification_user_id ON public.certification(user_id);
CREATE INDEX IF NOT EXISTS idx_certification_is_active ON public.certification(is_active);

-- Add updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_experience_updated_at BEFORE UPDATE ON public.work_experience FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON public.education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skill_updated_at BEFORE UPDATE ON public.skill FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON public.project FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certification_updated_at BEFORE UPDATE ON public.certification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
