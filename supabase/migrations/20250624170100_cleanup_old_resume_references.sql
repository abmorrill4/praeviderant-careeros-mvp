
-- Clean up any old references to the parse-resume function and ensure proper constraints

-- Ensure resume_versions table has the correct structure and constraints
DO $$
BEGIN
    -- Add any missing indexes for performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resume_versions_stream_id') THEN
        CREATE INDEX idx_resume_versions_stream_id ON resume_versions(stream_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resume_versions_file_hash') THEN
        CREATE INDEX idx_resume_versions_file_hash ON resume_versions(file_hash);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resume_versions_processing_status') THEN
        CREATE INDEX idx_resume_versions_processing_status ON resume_versions(processing_status);
    END IF;
END $$;

-- Ensure parsed_resume_entities has proper indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_parsed_resume_entities_version_id') THEN
        CREATE INDEX idx_parsed_resume_entities_version_id ON parsed_resume_entities(resume_version_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_parsed_resume_entities_field_name') THEN
        CREATE INDEX idx_parsed_resume_entities_field_name ON parsed_resume_entities(field_name);
    END IF;
END $$;

-- Ensure resume_streams has proper indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resume_streams_user_id') THEN
        CREATE INDEX idx_resume_streams_user_id ON resume_streams(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resume_streams_name') THEN
        CREATE INDEX idx_resume_streams_name ON resume_streams(user_id, name);
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key from resume_versions to resume_streams
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_resume_versions_stream_id'
    ) THEN
        ALTER TABLE resume_versions 
        ADD CONSTRAINT fk_resume_versions_stream_id 
        FOREIGN KEY (stream_id) REFERENCES resume_streams(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key from parsed_resume_entities to resume_versions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_parsed_resume_entities_version_id'
    ) THEN
        ALTER TABLE parsed_resume_entities 
        ADD CONSTRAINT fk_parsed_resume_entities_version_id 
        FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Clean up any orphaned records that might exist
DELETE FROM parsed_resume_entities 
WHERE resume_version_id NOT IN (SELECT id FROM resume_versions);

DELETE FROM resume_versions 
WHERE stream_id NOT IN (SELECT id FROM resume_streams);

-- Update any processing statuses that might be inconsistent
UPDATE resume_versions 
SET processing_status = 'pending' 
WHERE processing_status NOT IN ('pending', 'processing', 'completed', 'failed');
