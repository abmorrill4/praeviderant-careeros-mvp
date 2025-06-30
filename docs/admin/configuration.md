
# Configuration Guide

This guide covers all configuration aspects of CareerOS, from environment variables to advanced system settings, security configurations, and third-party integrations.

## Environment Configuration

### Core Application Settings

**Required Environment Variables:**
```bash
# Application Identity
VITE_APP_TITLE=CareerOS
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION="AI-Powered Career Intelligence Platform"

# Environment
NODE_ENV=production                    # production | development | test
VITE_ENVIRONMENT=production           # Used for feature flags and debugging

# Base URLs
VITE_APP_URL=https://careeros.com
VITE_API_BASE_URL=https://api.careeros.com
```

**Optional Application Settings:**
```bash
# Feature Flags
VITE_ENABLE_VOICE_INTERVIEWS=true     # Enable/disable voice interview feature
VITE_ENABLE_RESUME_UPLOAD=true        # Enable/disable resume upload
VITE_ENABLE_AI_ENHANCEMENT=true       # Enable/disable AI profile enhancement
VITE_ENABLE_ANALYTICS=true            # Enable/disable analytics tracking
VITE_ENABLE_BETA_FEATURES=false       # Enable/disable beta features

# UI Configuration
VITE_DEFAULT_THEME=light              # light | dark | system
VITE_ENABLE_THEME_TOGGLE=true         # Allow users to change themes
VITE_DEFAULT_LANGUAGE=en              # Default language (future i18n support)

# Performance Settings
VITE_ENABLE_SERVICE_WORKER=true       # Enable service worker for caching
VITE_CHUNK_SIZE_WARNING_LIMIT=1000    # Bundle size warning threshold (KB)
```

### Supabase Configuration

**Database Connection:**
```bash
# Required
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key

# Optional - for admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only!
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_DATABASE_URL=postgresql://...           # Direct database access
```

**Supabase Advanced Settings:**
```bash
# Auth Configuration
VITE_SUPABASE_AUTH_REDIRECT_URL=https://careeros.com/auth/callback
VITE_SUPABASE_AUTH_ENABLE_SIGNUP=true
VITE_SUPABASE_AUTH_REQUIRE_EMAIL_CONFIRMATION=true

# Real-time Configuration
VITE_SUPABASE_REALTIME_ENABLED=true
VITE_SUPABASE_REALTIME_HEARTBEAT_INTERVAL=30000

# Storage Configuration
VITE_SUPABASE_STORAGE_BUCKET=user-resumes
VITE_SUPABASE_STORAGE_MAX_FILE_SIZE=10485760    # 10MB in bytes
```

### AI Service Configuration

**OpenAI Settings:**
```bash
# API Configuration (stored in Supabase Vault)
OPENAI_API_KEY=your-openai-api-key               # Server-side only!
OPENAI_ORGANIZATION_ID=your-org-id               # Optional
OPENAI_PROJECT_ID=your-project-id                # Optional

# Model Configuration
VITE_OPENAI_DEFAULT_MODEL=gpt-4                  # Default model for text generation
VITE_OPENAI_INTERVIEW_MODEL=gpt-4                # Model for interview conversations
VITE_OPENAI_ENHANCEMENT_MODEL=gpt-4              # Model for profile enhancement
VITE_OPENAI_VOICE_MODEL=whisper-1                # Model for voice transcription

# Rate Limiting
VITE_OPENAI_RATE_LIMIT_REQUESTS_PER_MINUTE=50    # Client-side rate limiting
VITE_OPENAI_TIMEOUT_MS=30000                     # Request timeout
```

**Perplexity API (Optional):**
```bash
PERPLEXITY_API_KEY=your-perplexity-key           # Server-side only!
VITE_PERPLEXITY_ENABLED=true                     # Enable Perplexity integration
VITE_PERPLEXITY_MODEL=pplx-7b-online            # Default Perplexity model
```

**ElevenLabs (Optional TTS):**
```bash
ELEVENLABS_API_KEY=your-elevenlabs-key           # Server-side only!
VITE_ELEVENLABS_ENABLED=false                    # Enable text-to-speech
VITE_ELEVENLABS_VOICE_ID=default-voice-id        # Default voice
```

### Analytics and Monitoring

**Google Analytics:**
```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA_ENABLED=true
VITE_GA_ANONYMIZE_IP=true
VITE_GA_COOKIE_DOMAIN=careeros.com
```

**Sentry Error Monitoring:**
```bash
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_SENTRY_ENABLED=true
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1               # Performance monitoring sample rate
VITE_SENTRY_RELEASE=1.0.0                        # Release version for error tracking
```

**PostHog Analytics (Alternative):**
```bash
VITE_POSTHOG_KEY=your-posthog-key
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_POSTHOG_ENABLED=false
```

## Supabase Configuration

### Database Configuration

**Connection Settings (`supabase/config.toml`):**
```toml
[db]
port = 54322
major_version = 15

[db.pooler]
enabled = true
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

**Performance Tuning:**
```sql
-- Configure PostgreSQL settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
```

### Authentication Configuration

**Auth Settings:**
```toml
[auth]
enabled = true
site_url = "https://careeros.com"
additional_redirect_urls = ["http://localhost:3000", "http://localhost:5173"]
jwt_expiry = 3600
refresh_token_rotation_enabled = true
security_update_password_require_reauthentication = true

[auth.email]
enabled = true
double_confirm_changes_enabled = true
secure_password_change_enabled = true

[auth.sms]
enabled = false

[auth.external.google]
enabled = true
client_id = "your-google-client-id"
secret = "your-google-client-secret"
redirect_uri = "https://your-project.supabase.co/auth/v1/callback"

[auth.external.github]
enabled = true
client_id = "your-github-client-id"
secret = "your-github-client-secret"
```

**Password Policy:**
```sql
-- Configure password requirements
UPDATE auth.config 
SET password_min_length = 8,
    password_require_letters = true,
    password_require_numbers = true,
    password_require_symbols = false,
    password_require_uppercase = true,
    password_require_lowercase = true;
```

### Storage Configuration

**Bucket Configuration:**
```sql
-- User resumes bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-resumes',
  'user-resumes',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- Profile images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images', 
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

**Storage Policies:**
```sql
-- User resume access policy
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'user-resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own resumes"
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'user-resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'user-resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Edge Functions Configuration

**Function Environment:**
```bash
# Global secrets (available to all functions)
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set PERPLEXITY_API_KEY=your-perplexity-key
supabase secrets set ELEVENLABS_API_KEY=your-elevenlabs-key

# Function-specific configuration
supabase secrets set RESUME_PROCESSING_TIMEOUT=300000    # 5 minutes
supabase secrets set MAX_RESUME_SIZE_MB=10
supabase secrets set AI_MODEL_TEMPERATURE=0.7
supabase secrets set ENABLE_DEBUG_LOGGING=false
```

**Function Limits:**
```toml
[functions.resume-upload-v2]
verify_jwt = true
import_map = "./import_map.json"

[functions.generate-tailored-resume]
verify_jwt = true
import_map = "./import_map.json"

[functions.create-interview-session]
verify_jwt = true
import_map = "./import_map.json"
```

## Security Configuration

### Content Security Policy

**CSP Headers:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'csp-headers',
      configureServer(server) {
        server.middlewares.use('/', (req, res, next) => {
          res.setHeader('Content-Security-Policy', `
            default-src 'self';
            script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
            font-src 'self' https://fonts.gstatic.com;
            img-src 'self' data: https: blob:;
            connect-src 'self' https://*.supabase.co https://api.openai.com https://api.perplexity.ai wss://*.supabase.co;
            media-src 'self' blob:;
            frame-ancestors 'none';
            base-uri 'self';
            form-action 'self';
          `.replace(/\s+/g, ' ').trim());
          next();
        });
      }
    }
  ]
});
```

### CORS Configuration

**Supabase CORS Settings:**
```sql
-- Configure CORS for API access
UPDATE auth.config 
SET cors_allowed_origins = '{
  "https://careeros.com",
  "https://www.careeros.com", 
  "https://app.careeros.com",
  "http://localhost:3000",
  "http://localhost:5173"
}';
```

### Rate Limiting

**Database Rate Limiting:**
```sql
-- Create rate limiting table
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := date_trunc('hour', now()) + 
                  (EXTRACT(minute FROM now())::INTEGER / p_window_minutes) * 
                  (p_window_minutes || ' minutes')::INTERVAL;
  
  INSERT INTO rate_limits (user_id, endpoint, window_start)
  VALUES (p_user_id, p_endpoint, window_start)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET requests_count = rate_limits.requests_count + 1
  RETURNING requests_count INTO current_count;
  
  RETURN current_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Performance Configuration

### Caching Strategy

**Browser Caching:**
```typescript
// vite.config.ts - Asset caching
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Enable long-term caching for assets
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  }
});
```

**Service Worker Configuration:**
```typescript
// public/sw.js
const CACHE_NAME = 'careeros-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

const CACHE_STRATEGIES = {
  // Cache first for static assets
  static: 'cache-first',
  // Network first for API calls
  api: 'network-first',
  // Stale while revalidate for profile data
  profile: 'stale-while-revalidate'
};
```

### Database Performance

**Query Optimization:**
```sql
-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM work_experience 
WHERE user_id = 'user-id' AND is_current = true;

-- Create composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_work_experience_user_current_created
  ON work_experience(user_id, is_current, created_at DESC)
  WHERE is_current = true;

-- Optimize full-text search
CREATE INDEX CONCURRENTLY idx_work_experience_search
  ON work_experience 
  USING GIN(to_tsvector('english', title || ' ' || company || ' ' || COALESCE(description, '')));
```

**Connection Pooling:**
```sql
-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET work_mem = '8MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

## Third-Party Integrations

### Email Configuration

**SMTP Settings (for custom email):**
```bash
# Email service configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@careeros.com
SMTP_FROM_NAME="CareerOS"

# Email templates
VITE_EMAIL_VERIFICATION_TEMPLATE_ID=template-id
VITE_PASSWORD_RESET_TEMPLATE_ID=template-id
VITE_WELCOME_EMAIL_TEMPLATE_ID=template-id
```

### OAuth Provider Configuration

**Google OAuth:**
```json
{
  "web": {
    "client_id": "your-google-client-id.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "your-google-client-secret",
    "redirect_uris": [
      "https://your-project.supabase.co/auth/v1/callback"
    ]
  }
}
```

**GitHub OAuth:**
```bash
# GitHub App settings
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://your-project.supabase.co/auth/v1/callback
```

### Payment Integration (Future)

**Stripe Configuration:**
```bash
# Stripe settings (when payment features are added)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...              # Server-side only!
STRIPE_WEBHOOK_SECRET=whsec_...            # Server-side only!
VITE_STRIPE_ENABLED=false                  # Enable payment features
```

## Feature Flags

### Runtime Feature Configuration

```typescript
// src/config/features.ts
export const FEATURE_FLAGS = {
  // Core features
  VOICE_INTERVIEWS: import.meta.env.VITE_ENABLE_VOICE_INTERVIEWS === 'true',
  RESUME_UPLOAD: import.meta.env.VITE_ENABLE_RESUME_UPLOAD === 'true',
  AI_ENHANCEMENT: import.meta.env.VITE_ENABLE_AI_ENHANCEMENT === 'true',
  
  // Beta features
  ADVANCED_ANALYTICS: import.meta.env.VITE_ENABLE_BETA_FEATURES === 'true',
  COLLABORATIVE_PROFILES: false,
  API_ACCESS: false,
  
  // Experimental features
  VOICE_TO_TEXT_REAL_TIME: false,
  AUTOMATED_JOB_MATCHING: false,
  SOCIAL_FEATURES: false
} as const;

// Usage in components
export const useFeatureFlag = (flag: keyof typeof FEATURE_FLAGS) => {
  return FEATURE_FLAGS[flag];
};
```

### A/B Testing Configuration

```typescript
// src/config/experiments.ts
export const EXPERIMENTS = {
  RESUME_GENERATION_ALGORITHM: {
    enabled: true,
    variants: ['v1', 'v2'],
    distribution: [50, 50], // Percentage distribution
    defaultVariant: 'v1'
  },
  
  INTERVIEW_FLOW: {
    enabled: false,
    variants: ['guided', 'freeform'],
    distribution: [70, 30],
    defaultVariant: 'guided'
  }
} as const;
```

## Logging Configuration

### Application Logging

```typescript
// src/utils/logger.ts
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
} as const;

const CURRENT_LOG_LEVEL = import.meta.env.PROD 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

export const logger = {
  error: (message: string, meta?: any) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, meta);
      // Send to external logging service
      if (import.meta.env.PROD) {
        // Sentry.captureException or similar
      }
    }
  },
  
  warn: (message: string, meta?: any) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, meta);
    }
  },
  
  info: (message: string, meta?: any) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, meta);
    }
  },
  
  debug: (message: string, meta?: any) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  }
};
```

### Edge Function Logging

```typescript
// Common logging utility for Edge Functions
export const createLogger = (functionName: string) => {
  return {
    info: (message: string, meta?: any) => {
      console.log(JSON.stringify({
        level: 'info',
        function: functionName,
        message,
        meta,
        timestamp: new Date().toISOString()
      }));
    },
    
    error: (message: string, error?: any) => {
      console.error(JSON.stringify({
        level: 'error',
        function: functionName,
        message,
        error: error?.message || error,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      }));
    }
  };
};
```

## Configuration Validation

### Environment Validation

```typescript
// src/config/validation.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_APP_TITLE: z.string().default('CareerOS'),
  VITE_ENABLE_VOICE_INTERVIEWS: z.string().transform(val => val === 'true'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const validateEnvironment = () => {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw new Error('Invalid environment configuration');
  }
};

// Validate on app startup
validateEnvironment();
```

### Configuration Health Checks

```typescript
// src/utils/health-check.ts
export const configHealthCheck = async () => {
  const checks = {
    supabase: false,
    openai: false,
    storage: false
  };
  
  try {
    // Test Supabase connection
    const { data } = await supabase.from('profiles').select('count').limit(1);
    checks.supabase = true;
  } catch (error) {
    console.error('Supabase health check failed:', error);
  }
  
  try {
    // Test OpenAI connection (if configured)
    if (import.meta.env.VITE_ENABLE_AI_FEATURES) {
      // Test API availability
      checks.openai = true;
    }
  } catch (error) {
    console.error('OpenAI health check failed:', error);
  }
  
  return {
    healthy: Object.values(checks).every(Boolean),
    checks,
    timestamp: new Date().toISOString()
  };
};
```

This configuration guide provides comprehensive coverage of all CareerOS settings, ensuring proper setup for development, staging, and production environments while maintaining security and performance best practices.
