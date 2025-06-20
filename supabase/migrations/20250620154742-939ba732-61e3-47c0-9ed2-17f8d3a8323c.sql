
-- Create a table for LLM response caching
CREATE TABLE public.llm_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_hash TEXT NOT NULL UNIQUE,
  complexity TEXT NOT NULL,
  request_data JSONB NOT NULL,
  response_data JSONB NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  access_count INTEGER NOT NULL DEFAULT 1
);

-- Create an index on prompt_hash for fast lookups
CREATE INDEX idx_llm_cache_prompt_hash ON public.llm_cache(prompt_hash);

-- Create an index on created_at for cache cleanup operations
CREATE INDEX idx_llm_cache_created_at ON public.llm_cache(created_at);

-- Enable RLS (though this cache will be accessible by the service role)
ALTER TABLE public.llm_cache ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows the service to read/write cache entries
CREATE POLICY "Service can manage cache entries" 
  ON public.llm_cache 
  FOR ALL 
  USING (true)
  WITH CHECK (true);
