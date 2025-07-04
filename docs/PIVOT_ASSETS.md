# Pivot Assets Guide

## Overview

This document catalogs the reusable assets, transferable components, and valuable patterns from CareerOS that can be leveraged for strategic pivots or new product development. These assets represent significant investment and proven value that should be preserved and repurposed.

## 🧩 Reusable Component Library

### Core UI Components

**Design System Foundation** (`src/components/ui/`)
- **32 production-ready components** built on shadcn/ui
- **Semantic color system** with HSL tokens
- **Comprehensive variant system** using class-variance-authority
- **Full TypeScript coverage** with proper prop interfaces
- **Accessibility compliance** (WCAG 2.1 AA)

**High-Value Components**:
```typescript
// Multi-step form system
<StepperForm>
  <StepperForm.Step title="Basic Info">
    <PersonalInfoForm />
  </StepperForm.Step>
  <StepperForm.Step title="Professional Info">
    <ProfessionalInfoForm />
  </StepperForm.Step>
</StepperForm>

// Advanced data table with filtering
<DataTable 
  data={data}
  columns={columns}
  filtering={true}
  sorting={true}
  pagination={true}
/>

// File upload with progress
<FileUploadDropzone
  accept=".pdf,.docx"
  maxSize={10 * 1024 * 1024}
  onUpload={handleUpload}
  showProgress={true}
/>
```

**Transferable Value**:
- Immediate UI development acceleration
- Consistent design language
- Proven accessibility patterns
- Mobile-responsive design

### Specialized Components

**AI Processing Components** (`src/components/shared/`)
```typescript
// Real-time AI processing indicator
<AIProcessingIndicator 
  stages={processingStages}
  currentStage={currentStage}
  progress={progress}
/>

// Streaming text display
<StreamingTextDisplay
  content={aiResponse}
  typewriter={true}
  onComplete={handleComplete}
/>

// Voice interface controls
<VoiceControls
  onStartRecording={startRecording}
  onStopRecording={stopRecording}
  isRecording={isRecording}
  audioLevel={audioLevel}
/>
```

**Data Visualization Components**
```typescript
// Interactive timeline
<InteractiveTimeline
  data={careerData}
  onItemClick={handleItemClick}
  onRangeSelect={handleRangeSelect}
/>

// Skill proficiency charts
<SkillCharts
  skills={skillData}
  type="radar" // or "bar", "bubble"
  interactive={true}
/>

// Profile completeness indicator
<ProfileCompletenessCard
  completeness={score}
  missingFields={fields}
  onActionClick={handleAction}
/>
```

## 🎨 Design System Assets

### Color Palette & Tokens

**Semantic Color System** (`src/index.css`):
```css
:root {
  /* Brand colors */
  --career-accent: 266 83% 58%;
  --career-text: 222.2 84% 4.9%;
  --career-panel: 0 0% 100%;
  
  /* Progressive navigation phases */
  --nav-build: 142 77% 53%;
  --nav-optimize: 47 96% 53%;
  --nav-apply: 262 83% 58%;
  
  /* Status indicators */
  --status-success: 142 77% 53%;
  --status-warning: 47 96% 53%;
  --status-error: 0 84% 60%;
  --status-info: 200 95% 60%;
}
```

**Reusable Value**:
- Professional color combinations
- Accessibility-compliant contrast ratios
- Semantic naming convention
- Dark/light mode support

### Typography System

**Font Hierarchy** (`tailwind.config.ts`):
```typescript
typography: {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    'display-1': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
    'display-2': ['3rem', { lineHeight: '1.2', fontWeight: '600' }],
    'heading-1': ['2.25rem', { lineHeight: '1.3', fontWeight: '600' }],
    'heading-2': ['1.875rem', { lineHeight: '1.4', fontWeight: '500' }],
    'body-large': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
    'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
    'caption': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
  }
}
```

### Layout Patterns

**Responsive Grid System**:
```typescript
// Dashboard layout pattern
const DashboardLayout = ({ sidebar, main, aside }) => (
  <div className="min-h-screen bg-background">
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]">
      <aside className="hidden lg:block border-r border-border">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-auto">
        {main}
      </main>
      <aside className="hidden xl:block border-l border-border">
        {aside}
      </aside>
    </div>
  </div>
);
```

## 🔧 Custom Hooks Library

### Data Management Hooks

**Optimized Authentication** (`src/hooks/useAuthOptimized.ts`):
```typescript
export const useAuthOptimized = () => {
  return useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1,
  });
};
```

**Generic Data Fetching** (`src/hooks/useDataFetch.ts`):
```typescript
export function useDataFetch<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}
```

**Real-time Subscriptions** (`src/hooks/useRealtimeSubscription.ts`):
```typescript
export const useRealtimeSubscription = <T>(
  table: string,
  filter?: string,
  initialData?: T[]
) => {
  const [data, setData] = useState<T[]>(initialData || []);
  
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
      }, handleChange)
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [table, filter]);
  
  return data;
};
```

### UI Interaction Hooks

**Form Management** (`src/hooks/useFormManager.ts`):
```typescript
export const useFormManager = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: ZodSchema<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  const validate = useCallback(() => {
    if (!validationSchema) return true;
    
    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as keyof T] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [values, validationSchema]);
  
  return {
    values,
    errors,
    isSubmitting,
    setValue,
    setValues,
    validate,
    setIsSubmitting
  };
};
```

## 🤖 AI Integration Framework

### Edge Function Templates

**OpenAI Proxy Template** (`supabase/functions/_templates/openai-proxy.ts`):
```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenAIRequest {
  messages: any[];
  model?: string;
  temperature?: number;
  stream?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model = 'gpt-4o-mini', temperature = 0.3, stream = false }: OpenAIRequest = await req.json();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream
      }),
    });

    if (stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Voice Processing Template** (`supabase/functions/_templates/voice-processing.ts`):
```typescript
// Reusable voice-to-text and text-to-voice processing
const processAudioUpload = async (audioData: string): Promise<string> => {
  const formData = new FormData();
  const audioBlob = base64ToBlob(audioData);
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: formData,
  });

  const result = await response.json();
  return result.text;
};
```

### AI Pipeline Patterns

**Multi-Pass Processing System**:
```typescript
interface ProcessingPass {
  id: string;
  name: string;
  model: 'gpt-4o' | 'gpt-4o-mini' | 'o3';
  purpose: string;
  dependencies: string[];
  processor: (data: any, context: Map<string, any>) => Promise<any>;
}

class AIProcessingPipeline {
  private passes: ProcessingPass[] = [];
  private results = new Map<string, any>();
  
  addPass(pass: ProcessingPass) {
    this.passes.push(pass);
    return this;
  }
  
  async execute(initialData: any): Promise<Map<string, any>> {
    const completed = new Set<string>();
    
    while (completed.size < this.passes.length) {
      const ready = this.passes.filter(pass => 
        !completed.has(pass.id) && 
        pass.dependencies.every(dep => completed.has(dep))
      );
      
      if (ready.length === 0) {
        throw new Error('Circular dependency or missing dependency in pipeline');
      }
      
      await Promise.all(ready.map(async (pass) => {
        const result = await pass.processor(initialData, this.results);
        this.results.set(pass.id, result);
        completed.add(pass.id);
      }));
    }
    
    return this.results;
  }
}
```

## 🗄️ Database Architecture Patterns

### Versioned Entity System

**Generic Versioned Entity Pattern**:
```sql
-- Template for versioned entities
CREATE TABLE public.{entity_type} (
  logical_entity_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT,
  source_confidence DOUBLE PRECISION,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Entity-specific fields
  {specific_fields}
);

-- Indexes for performance
CREATE INDEX idx_{entity_type}_user_active ON public.{entity_type} (user_id, is_active);
CREATE INDEX idx_{entity_type}_logical_entity ON public.{entity_type} (logical_entity_id, version);

-- RLS policy template
CREATE POLICY "optimized_{entity_type}_access" ON public.{entity_type}
  FOR ALL USING (public.current_user_id() = user_id);
```

### Processing Pipeline Tables

**Reusable Processing Framework**:
```sql
-- Generic processing job table
CREATE TABLE public.processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_data JSONB NOT NULL,
  output_data JSONB,
  processing_stages JSONB DEFAULT '{}',
  current_stage TEXT,
  progress_percentage INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Processing logs table
CREATE TABLE public.processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES processing_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

## 🔐 Security & Authentication Patterns

### Row Level Security Templates

**Performance-Optimized RLS Functions**:
```sql
-- Cached user context function
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid();
$$;

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin_user_optimized(user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    EXISTS(
      SELECT 1 FROM auth.users 
      WHERE id = COALESCE(user_id, auth.uid())
      AND (
        raw_user_meta_data->>'user_role' = 'admin' OR
        email IN ('admin@domain.com')
      )
    ),
    false
  );
$$;
```

### Encryption Utilities

**Client-Side Encryption Hooks**:
```typescript
export const useEncryption = () => {
  const encrypt = useCallback(async (data: string): Promise<string> => {
    const { data: result, error } = await supabase.functions.invoke('encrypt-data', {
      body: { data }
    });
    
    if (error) throw error;
    return result.encrypted;
  }, []);
  
  const decrypt = useCallback(async (encryptedData: string): Promise<string> => {
    const { data: result, error } = await supabase.functions.invoke('decrypt-data', {
      body: { encryptedData }
    });
    
    if (error) throw error;
    return result.decrypted;
  }, []);
  
  return { encrypt, decrypt };
};
```

## 📱 Mobile-First Patterns

### Responsive Design Framework

**Mobile-Optimized Components**:
```typescript
// Adaptive layout hook
export const useResponsiveLayout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
};

// Responsive navigation pattern
const ResponsiveNavigation = ({ items }) => {
  const { isMobile } = useResponsiveLayout();
  
  if (isMobile) {
    return <MobileNavigation items={items} />;
  }
  
  return <DesktopNavigation items={items} />;
};
```

## 🧪 Testing Infrastructure

### Testing Utilities

**Component Testing Helpers**:
```typescript
// Test utilities with providers
export const renderWithProviders = (component: React.ReactElement, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
  
  return render(component, { wrapper: Wrapper, ...options });
};

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: uuid(),
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
  ...overrides
});

export const createMockWorkExperience = (overrides = {}) => ({
  logical_entity_id: uuid(),
  version: 1,
  is_active: true,
  company: 'Test Company',
  title: 'Software Engineer',
  start_date: '2020-01-01',
  end_date: '2023-01-01',
  ...overrides
});
```

## 🔄 Migration Utilities

### Data Migration Tools

**Schema Evolution Helpers**:
```sql
-- Safe migration function template
CREATE OR REPLACE FUNCTION public.safe_add_column(
  table_name TEXT,
  column_name TEXT,
  column_type TEXT,
  default_value TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = $1 AND column_name = $2
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s %s',
      table_name, column_name, column_type, 
      CASE WHEN default_value IS NOT NULL THEN 'DEFAULT ' || default_value ELSE '' END
    );
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;
```

**Data Backfill Patterns**:
```sql
-- Safe data backfill with error handling
DO $$
DECLARE
  r RECORD;
  error_count INTEGER := 0;
BEGIN
  FOR r IN (SELECT id FROM table_name WHERE condition) LOOP
    BEGIN
      -- Perform update
      UPDATE table_name SET column = value WHERE id = r.id;
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Failed to update record %: %', r.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Backfill completed with % errors', error_count;
END $$;
```

## 📊 Analytics & Monitoring

### Performance Monitoring

**Custom Performance Hooks**:
```typescript
export const usePerformanceMonitoring = () => {
  const recordMetric = useCallback((name: string, value: number, tags = {}) => {
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now(),
      page: window.location.pathname,
      userAgent: navigator.userAgent
    };
    
    // Send to analytics service
    analytics.track('performance_metric', metric);
  }, []);
  
  const measureRenderTime = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      recordMetric('component_render_time', duration, { component: componentName });
    };
  }, [recordMetric]);
  
  return { recordMetric, measureRenderTime };
};
```

## 🚀 Deployment Assets

### CI/CD Templates

**GitHub Actions Workflow**:
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Supabase
        run: |
          npx supabase functions deploy
          npx supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_REF: ${{ secrets.PROJECT_REF }}
```

## 💰 Estimated Asset Value

### Development Time Savings

**Component Library**: 200+ hours of development time
**Hooks & Utilities**: 150+ hours of development time  
**AI Integration Framework**: 300+ hours of development time
**Database Patterns**: 100+ hours of architecture design
**Testing Infrastructure**: 80+ hours of setup and configuration

**Total Estimated Value**: 800+ hours of proven, production-ready code

### Transferable Technologies

**Core Stack**:
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query for state management
- Supabase for backend services
- OpenAI API integrations

**Infrastructure**:
- Edge functions for serverless compute
- Row Level Security patterns
- Real-time subscriptions
- File upload and processing

## 🎯 Pivot Applications

### Potential Use Cases

1. **HR Tech Platform**: Leverage profile management and AI processing
2. **EdTech Solution**: Adapt skill assessment and progress tracking
3. **Professional Services**: Use AI analysis and document processing
4. **SaaS Dashboard**: Utilize component library and authentication
5. **Content Management**: Apply AI text processing and user management

### Quick Pivot Checklist

- [ ] Extract reusable components to shared package
- [ ] Document API contracts and data models
- [ ] Create deployment templates and CI/CD pipelines
- [ ] Package AI processing patterns as microservices
- [ ] Prepare database migration scripts
- [ ] Archive learning materials and documentation

---

**Document Status**: Pivot Assets Guide v1.0
**Last Updated**: January 2025
**Dependencies**: TECHNICAL_FOUNDATION.md, IMPLEMENTATION_PATTERNS.md, LESSONS_LEARNED.md

This comprehensive asset catalog provides a strategic foundation for efficient pivot execution, preserving significant development investment while enabling rapid deployment in new domains.