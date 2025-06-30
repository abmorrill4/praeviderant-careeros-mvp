
# Development Setup Guide

This guide will help you set up a complete development environment for CareerOS, including all dependencies, tools, and configurations needed for effective development.

## Prerequisites

### Required Software

**Node.js and npm**
```bash
# Install Node.js 18+ (recommended: use nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
node --version  # Should be 18.x.x or higher
npm --version   # Should be 9.x.x or higher
```

**Git**
```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt-get install git

# Windows
# Download from https://git-scm.com/download/win

git --version  # Verify installation
```

**Code Editor**
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint

### Required Accounts

**Supabase Account**
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

**OpenAI Account**
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Generate an API key
3. Ensure you have credits available for API calls

**Optional Services**
- **Perplexity API** (for enhanced research capabilities)
- **ElevenLabs** (for text-to-speech features)
- **GitHub** (for version control and deployment)

## Project Setup

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/careeros.git
cd careeros

# Or if using SSH
git clone git@github.com:your-org/careeros.git
cd careeros
```

### Install Dependencies

```bash
# Install project dependencies
npm install

# Verify installation
npm list --depth=0
```

### Environment Configuration

**Create Environment File**
```bash
cp .env.example .env.local
```

**Configure Environment Variables**
```bash
# .env.local

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development Settings
NODE_ENV=development
VITE_APP_TITLE=CareerOS Dev
VITE_APP_VERSION=1.0.0-dev
```

**Important Notes:**
- Never commit `.env.local` to version control
- Use different Supabase projects for development and production
- Keep API keys secure and rotate them regularly

## Supabase Setup

### Database Setup

**1. Access Supabase Dashboard**
- Go to [supabase.com/dashboard](https://supabase.com/dashboard)
- Select your project
- Navigate to SQL Editor

**2. Run Initial Migrations**
```sql
-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "vector";

-- Create basic profile table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create profile policies
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);
```

**3. Configure Authentication**
- In Supabase Dashboard → Authentication → Settings
- Configure your site URL: `http://localhost:5173`
- Set up email templates if needed
- Configure OAuth providers if desired

**4. Set up Storage**
- Navigate to Storage in Supabase Dashboard
- Create a bucket named `user-resumes`
- Configure appropriate policies for file access

### API Keys Configuration

**1. Supabase Vault Setup**
```sql
-- Store OpenAI API key securely
select vault.create_secret('your-openai-api-key', 'openai_api_key');

-- Verify secret storage
select name from vault.secrets;
```

**2. Edge Functions Setup**
- Supabase CLI is required for local Edge Functions development
- See [Edge Functions Development](#edge-functions-development) below

## Development Environment

### Start Development Server

```bash
# Start the development server
npm run dev

# Server will start on http://localhost:5173
# Open browser and navigate to the URL
```

**Development Features:**
- Hot module replacement for instant updates
- TypeScript error checking
- ESLint warnings and errors
- Tailwind CSS compilation
- Automatic browser refresh

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:host         # Start server accessible on network

# Building
npm run build            # Build for production
npm run preview          # Preview production build locally

# Code Quality
npm run type-check       # Run TypeScript compiler checks
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
npm run format           # Format code with Prettier

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Project Structure

```
careeros/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Basic UI components (shadcn/ui)
│   │   ├── shared/       # Shared business components
│   │   └── [feature]/    # Feature-specific components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── contexts/         # React context providers
│   ├── integrations/     # External service integrations
│   └── lib/              # Shared libraries and configurations
├── docs/                 # Documentation
├── supabase/            # Supabase configuration and functions
│   ├── functions/       # Edge Functions
│   ├── migrations/      # Database migrations
│   └── config.toml      # Supabase configuration
└── ...config files
```

## Edge Functions Development

### Supabase CLI Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id
```

### Local Development

```bash
# Start Supabase local development
supabase start

# Start Edge Functions locally
supabase functions serve

# Deploy function to remote
supabase functions deploy function-name
```

### Function Development Workflow

**1. Create New Function**
```bash
supabase functions new my-function
```

**2. Develop Function**
```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Function logic here
    
    return new Response(
      JSON.stringify({ message: 'Success' }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
})
```

**3. Test Function**
```bash
# Test locally
curl -X POST http://localhost:54321/functions/v1/my-function \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Deploy and test remotely
supabase functions deploy my-function
```

## Development Tools Configuration

### VS Code Settings

**Create `.vscode/settings.json`**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

**Recommended Extensions (`.vscode/extensions.json`)**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Git Configuration

**`.gitignore` (already configured)**
```
# Dependencies
node_modules/

# Environment
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/

# IDE
.vscode/settings.json
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

**Git Hooks Setup**
```bash
# Install husky for git hooks
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
```

## Debugging and Development Tools

### Browser Developer Tools

**React Developer Tools**
- Install React DevTools browser extension
- Inspect component hierarchy and props
- Monitor state changes and context values

**Network Monitoring**
- Monitor API calls to Supabase
- Check request/response payloads
- Debug authentication headers

### Development Debugging

**Console Logging**
```typescript
// Use structured logging
console.log('Profile data:', { userId, profileData });

// Use debugging utility
import { debug } from '@/utils/debug';
debug.profile('User profile loaded', profileData);
```

**Error Boundaries**
```typescript
// Component-level error handling
import { ErrorBoundary } from '@/components/ui/error-fallback';

<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>
```

### Performance Monitoring

**React Query DevTools**
```typescript
// Add to your App component in development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      {/* Your app */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  )
}
```

## Common Development Issues

### Port Conflicts
```bash
# If port 5173 is in use
npm run dev -- --port 3000

# Or set in vite.config.ts
export default defineConfig({
  server: {
    port: 3000
  }
})
```

### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run type-check

# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Supabase Connection Issues
```bash
# Verify environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
curl -X GET $VITE_SUPABASE_URL/rest/v1/ \
  -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

### Build Issues
```bash
# Clear build cache
rm -rf dist/ node_modules/.vite
npm install
npm run build
```

## Testing Setup

### Unit Testing with Vitest

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Run tests
npm run test
```

**Test Configuration (`vitest.config.ts`)**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

### Integration Testing

```typescript
// Example component test
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProfileTimeline } from '@/components/profile/ProfileTimeline'

describe('ProfileTimeline', () => {
  it('renders profile sections', () => {
    render(<ProfileTimeline />)
    expect(screen.getByText('Work Experience')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
  })
})
```

## Deployment Preparation

### Environment Variables for Production

```bash
# Production environment variables
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
NODE_ENV=production
```

### Build Optimization

```bash
# Production build
npm run build

# Analyze bundle size
npm install -D rollup-plugin-visualizer
npm run build -- --analyze
```

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Build passes without errors
- [ ] TypeScript checks pass
- [ ] Tests pass
- [ ] Performance benchmarks met

You're now ready to develop CareerOS! Start the development server with `npm run dev` and begin exploring the codebase. Check out the [Contributing Guidelines](./contributing.md) for information about our development workflow and standards.
