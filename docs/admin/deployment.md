# Deployment Guide

This comprehensive guide covers deploying CareerOS to production environments, including Lovable's platform, custom deployments, and enterprise configurations.

## Deployment Options

### 1. Lovable Platform (Recommended)

**Advantages:**
- Zero-configuration deployment
- Automatic HTTPS and CDN
- Built-in preview environments
- Integrated with development workflow

**Process:**
1. Push changes to your connected GitHub repository
2. Lovable automatically builds and deploys
3. Access your live application at your custom domain

### 2. Custom Cloud Deployment

**Supported Platforms:**
- Vercel
- Netlify
- AWS Amplify
- Google Cloud Platform
- Microsoft Azure
- DigitalOcean App Platform

### 3. Self-Hosted Enterprise

**Requirements:**
- Docker support
- HTTPS termination
- Environment variable management
- CI/CD pipeline integration

## Pre-Deployment Checklist

### Environment Preparation

**Required Environment Variables:**
```bash
# Production Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Application Configuration
NODE_ENV=production
VITE_APP_TITLE=CareerOS
VITE_APP_VERSION=1.0.0

# Optional Analytics and Monitoring
VITE_ANALYTICS_ID=your-analytics-id
VITE_SENTRY_DSN=your-sentry-dsn
```

**Security Validation:**
- [ ] All API keys are production-specific
- [ ] No development URLs in configuration
- [ ] CORS settings allow production domain
- [ ] Rate limiting configured appropriately
- [ ] SSL/TLS certificates valid

### Database Preparation

**Migration Status:**
```bash
# Verify all migrations are applied
supabase db diff --use-migra
supabase db push

# Verify database schema matches expectations
supabase gen types typescript --local > temp-types.ts
diff src/integrations/supabase/types.ts temp-types.ts
```

**Data Validation:**
```sql
-- Check critical tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 'work_experience', 'education', 
  'skill', 'resume_versions', 'interview_sessions'
);

-- Verify RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### Edge Functions Deployment

**Deploy All Functions:**
```bash
# Deploy individual functions
supabase functions deploy resume-upload-v2
supabase functions deploy parse-resume-structured
supabase functions deploy generate-tailored-resume
supabase functions deploy create-interview-session

# Or deploy all at once
supabase functions deploy --no-verify-jwt
```

**Function Configuration:**
```bash
# Set required secrets
supabase secrets set OPENAI_API_KEY=your-openai-key
supabase secrets set PERPLEXITY_API_KEY=your-perplexity-key

# Verify secrets are set
supabase secrets list
```

## Lovable Platform Deployment

### Initial Setup

**1. Connect GitHub Repository**
```bash
# From Lovable editor
GitHub → Connect to GitHub → Select Repository
```

**2. Configure Domain**
```bash
# In Lovable dashboard
Project Settings → Domains → Add Custom Domain
# Follow DNS configuration instructions
```

**3. Environment Variables**
```bash
# In Lovable dashboard
Project Settings → Environment Variables
# Add all required production variables
```

### Deployment Process

**Automatic Deployment:**
- Push to main branch triggers automatic deployment
- Build logs available in Lovable dashboard
- Rollback available from deployment history

**Manual Deployment:**
```bash
# From Lovable editor
Deploy → Publish → Confirm deployment
```

### Production Monitoring

**Built-in Analytics:**
- Page views and user engagement
- Performance metrics
- Error tracking
- Custom event tracking

**Custom Monitoring:**
```typescript
// Add to main.tsx
if (import.meta.env.PROD) {
  // Initialize analytics
  analytics.initialize({
    writeKey: import.meta.env.VITE_ANALYTICS_KEY
  });
  
  // Error reporting
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production'
  });
}
```

## Custom Cloud Deployment

### Vercel Deployment

**Setup Process:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
vercel

# Configure environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

**Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Netlify Deployment

**Setup Process:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy

# Deploy to production
netlify deploy --prod
```

**Configuration (`netlify.toml`):**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### AWS Amplify

**Setup Process:**
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify project
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

**Build Settings:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Docker Deployment

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
# nginx.conf
events {
  worker_connections 1024;
}

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;
  
  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json;

  server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Handle client-side routing
    location / {
      try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }

    # Prevent access to sensitive files
    location ~ /\. {
      deny all;
    }
  }
}
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  careeros:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Optional: Add reverse proxy
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./proxy.conf:/etc/nginx/nginx.conf
    depends_on:
      - careeros
```

## Production Optimization

### Build Optimization

**Vite Configuration (`vite.config.ts`):**
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate large dependencies
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true
  },
  // Optimize dev server
  server: {
    // Enable compression
    cors: true,
    // Optimize HMR
    hmr: {
      overlay: false
    }
  }
});
```

### Performance Monitoring

**Core Web Vitals Tracking:**
```typescript
// src/utils/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log(metric);
}

// Measure Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**Bundle Analysis:**
```bash
# Analyze bundle size
npm install -D rollup-plugin-visualizer
npm run build -- --analyze

# Check for duplicate dependencies
npx duplicate-package-checker-webpack-plugin
```

## Security Configuration

### Content Security Policy

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co https://api.openai.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

### Environment Security

**Production Environment Variables:**
```bash
# Never expose in client-side code
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
DATABASE_URL=your-database-url

# Client-side (prefixed with VITE_)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_TITLE=CareerOS
```

### SSL/TLS Configuration

**Certificate Management:**
```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Automatic renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### Application Monitoring

**Error Tracking with Sentry:**
```typescript
// src/utils/monitoring.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter out development errors
    if (import.meta.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  }
});
```

**Performance Monitoring:**
```typescript
// src/utils/analytics.ts
export const trackPageView = (page: string) => {
  if (import.meta.env.PROD) {
    // Google Analytics
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: page,
      page_location: window.location.href
    });
  }
};

export const trackEvent = (action: string, category: string, label?: string) => {
  if (import.meta.env.PROD) {
    gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }
};
```

### Infrastructure Monitoring

**Health Check Endpoint:**
```typescript
// src/utils/health.ts
export const healthCheck = async () => {
  try {
    // Check Supabase connection
    const { data, error } = await supabase.from('profiles').select('count').single();
    
    if (error) throw error;
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        authentication: 'active'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
```

## Backup and Recovery

### Database Backup

**Automated Backups:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > backup_$DATE.sql.gz

# Upload to cloud storage
aws s3 cp backup_$DATE.sql.gz s3://your-backup-bucket/
```

**Recovery Process:**
```bash
# Restore from backup
gunzip -c backup_20240101_000000.sql.gz | psql $DATABASE_URL
```

### Application State Backup

**User Data Export:**
```typescript
// Automated user data exports
export const createUserBackup = async (userId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  const { data: workExperience } = await supabase
    .from('work_experience')
    .select('*')
    .eq('user_id', userId)
    .eq('is_current', true);
    
  // Continue for all user data...
  
  return {
    profile,
    workExperience,
    // ... other user data
    exportedAt: new Date().toISOString()
  };
};
```

## Maintenance and Updates

### Rolling Updates

**Zero-Downtime Deployment:**
```bash
# Using blue-green deployment
# 1. Deploy to staging environment
# 2. Run health checks
# 3. Switch traffic to new version
# 4. Keep old version running until confirmed stable
```

### Database Migrations

**Safe Migration Process:**
```bash
# 1. Backup database
pg_dump $DATABASE_URL > pre_migration_backup.sql

# 2. Run migration in transaction
supabase db push --dry-run
supabase db push

# 3. Verify migration success
supabase db diff

# 4. Test application functionality
npm run test:integration
```

### Monitoring Deployment Health

**Post-Deployment Checks:**
```bash
#!/bin/bash
# deployment-health-check.sh

echo "Checking application health..."

# Check HTTP response
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com)
if [ $RESPONSE -eq 200 ]; then
  echo "✓ Application responding"
else
  echo "✗ Application not responding (HTTP $RESPONSE)"
  exit 1
fi

# Check API endpoints
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/api/health)
if [ $API_RESPONSE -eq 200 ]; then
  echo "✓ API endpoints healthy"
else
  echo "✗ API endpoints unhealthy"
  exit 1
fi

echo "Deployment health check passed!"
```

This deployment guide ensures CareerOS can be reliably deployed and maintained in production environments with proper security, monitoring, and backup procedures in place.
