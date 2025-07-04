# Technical Foundation Documentation

## Overview

CareerOS represents a sophisticated AI-powered career intelligence platform built on modern web technologies. This document captures the core technical architecture, innovations, and design patterns that form the foundation of the system.

## 🏗️ Core Architecture

### Technology Stack

**Frontend Stack:**
- **React 18** with TypeScript for type-safe component architecture
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with comprehensive design system
- **shadcn/ui** component library with extensive customization
- **React Router** for client-side routing
- **TanStack Query** for server state management
- **React Hook Form** for form management

**Backend Infrastructure:**
- **Supabase** as primary backend-as-a-service
- **PostgreSQL** database with advanced RLS (Row Level Security)
- **Supabase Edge Functions** for serverless compute
- **Real-time subscriptions** for live data updates

**AI & Processing:**
- **OpenAI GPT-4** integration for content generation and analysis
- **Real-time Voice API** for interview conversations
- **Custom AI pipelines** for resume processing and enrichment
- **Embedding-based** similarity matching

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI primitives (shadcn/ui)
│   ├── shared/          # Cross-feature components
│   ├── admin/           # Administrative interfaces
│   ├── application-toolkit/  # Resume/cover letter tools
│   ├── auth/            # Authentication components
│   ├── interview/       # AI interview system
│   ├── profile/         # Profile management
│   └── resume-upload/   # Resume processing pipeline
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── pages/               # Route-level components
├── types/               # TypeScript definitions
├── utils/               # Pure utility functions
└── integrations/        # External service integrations

supabase/
├── functions/           # Edge functions
├── migrations/          # Database schema evolution
└── config.toml         # Supabase configuration
```

## 🔧 Key Technical Innovations

### 1. Versioned Entity System

**Innovation**: A sophisticated versioned entity system that tracks career data evolution over time.

**Technical Implementation:**
- **Logical Entity IDs**: Group related versions together
- **Version Tracking**: Incremental version numbers with active flags
- **Source Attribution**: Track data origin (interview, upload, manual)
- **Conflict Resolution**: Smart merging of data from multiple sources

**Database Schema Pattern:**
```sql
-- Example: work_experience table
CREATE TABLE work_experience (
  logical_entity_id UUID DEFAULT gen_random_uuid(),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  source TEXT,
  source_confidence DOUBLE PRECISION,
  -- Entity-specific fields
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT
);
```

**Benefits:**
- Complete audit trail of career data changes
- Rollback capabilities to previous versions
- Source attribution for data provenance
- Intelligent conflict resolution between data sources

### 2. AI-Powered Resume Processing Pipeline

**Innovation**: Multi-stage AI pipeline that transforms unstructured resume data into structured, enriched career profiles.

**Pipeline Stages:**
1. **Upload & Parsing**: PDF/Word to structured text
2. **Entity Extraction**: AI identifies career entities (jobs, skills, education)
3. **Normalization**: Standardize entities across users
4. **Enrichment**: AI analysis for insights and narratives
5. **Timeline Generation**: Chronological career story construction

**Technical Features:**
- **Progress Tracking**: Real-time pipeline status updates
- **Error Recovery**: Graceful handling of processing failures
- **Batch Processing**: Efficient handling of multiple resumes
- **Quality Scoring**: Confidence metrics for AI decisions

### 3. Real-time AI Interview System

**Innovation**: Voice-enabled AI interview system with contextual conversation flow.

**Technical Components:**
- **WebSocket Connections**: Real-time communication
- **Voice Processing**: Audio encoding/decoding (PCM16 at 24kHz)
- **Context Management**: Maintain conversation state
- **Entity Extraction**: Real-time extraction from speech
- **Smart Guidance**: Adaptive question flows

**Audio Pipeline:**
```typescript
// Audio processing chain
MediaStream -> AudioContext -> ScriptProcessor -> PCM16 -> Base64 -> WebSocket
```

### 4. Semantic Entity Normalization

**Innovation**: AI-powered system to normalize and deduplicate entities across users.

**Technical Approach:**
- **Embedding Generation**: Vector representations of entities
- **Similarity Matching**: Cosine similarity for entity comparison
- **Administrative Review**: Human-in-the-loop for edge cases
- **Graph-based Storage**: Entity relationships and aliases

**Benefits:**
- Consistent entity representation across the platform
- Improved search and matching capabilities
- Data quality improvement over time
- Analytics and insights at scale

## 🎨 Design System Architecture

### Semantic Design Tokens

**Innovation**: Comprehensive design system using HSL color tokens for consistent theming.

**Color System:**
```css
:root {
  /* Semantic tokens */
  --career-accent: 266 83% 58%;
  --career-text: 222.2 84% 4.9%;
  --career-panel: 0 0% 100%;
  
  /* Progressive navigation phases */
  --nav-build: 142 77% 53%;      /* Green for Build */
  --nav-optimize: 47 96% 53%;    /* Orange for Optimize */
  --nav-apply: 262 83% 58%;      /* Purple for Apply */
}
```

**Design Philosophy:**
- **Semantic Naming**: Colors tied to purpose, not appearance
- **HSL Color Space**: Intuitive hue, saturation, lightness control
- **Component Variants**: Systematic component customization
- **Responsive First**: Mobile-optimized design patterns

### Component Architecture

**Principle**: Composition over inheritance with extensive customization.

**Pattern:**
```typescript
// Base component with variants
const buttonVariants = cva(
  "base-styles",
  {
    variants: {
      variant: {
        default: "default-styles",
        career: "career-specific-styles",
        neumorphic: "neumorphic-styles"
      }
    }
  }
)
```

## 🔒 Security & Performance Architecture

### Security Patterns

**Row Level Security (RLS):**
- Comprehensive RLS policies on all user data
- Function-based security checks
- Optimized user isolation
- Admin privilege separation

**Authentication Flow:**
- Supabase Auth integration
- JWT-based session management
- Google OAuth integration
- Secure credential handling

### Performance Optimizations

**Database Layer:**
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed queries and proper joins
- **Caching Strategy**: React Query for client-side caching
- **Batch Operations**: Reduce database round trips

**Frontend Optimizations:**
- **Code Splitting**: Lazy loading of route components
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: Responsive images and lazy loading
- **State Management**: Efficient React state patterns

## 🔄 Data Flow Architecture

### Request Flow Pattern

```
Client Request -> Auth Middleware -> Edge Function -> Database -> AI Service -> Response
```

**Key Patterns:**
1. **Authentication First**: All requests validated before processing
2. **Edge Functions**: Serverless compute for AI operations
3. **Streaming Responses**: Real-time progress updates
4. **Error Boundaries**: Graceful error handling at each layer

### Real-time Updates

**Supabase Realtime Integration:**
```typescript
// Real-time subscription pattern
useEffect(() => {
  const channel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'resume_versions'
    }, handleUpdate)
    .subscribe()
  
  return () => supabase.removeChannel(channel)
}, [])
```

## 🧠 AI Integration Patterns

### Multi-Model AI Strategy

**Models Used:**
- **GPT-4**: Complex reasoning and analysis
- **GPT-4-mini**: Fast processing for simple tasks
- **Whisper**: Audio transcription
- **Embeddings**: Semantic similarity matching

**Integration Patterns:**
- **Edge Function Proxy**: Secure API key management
- **Streaming Responses**: Real-time AI output
- **Error Recovery**: Fallback mechanisms for AI failures
- **Rate Limiting**: Proper API usage management

### Custom AI Pipelines

**Resume Enrichment Pipeline:**
```typescript
// Multi-pass AI processing
const enrichmentPasses = [
  { model: 'gpt-4-mini', purpose: 'entity_extraction' },
  { model: 'gpt-4', purpose: 'semantic_analysis' },
  { model: 'gpt-4', purpose: 'narrative_generation' }
]
```

## 📊 Monitoring & Observability

### Logging Strategy

**Structured Logging:**
- Correlation IDs for request tracing
- Performance metrics collection
- Error tracking and alerting
- User analytics integration

**Debug Infrastructure:**
- Admin debug dashboard
- Processing analytics
- System health monitoring
- Security audit logging

## 🚀 Deployment & DevOps

### Build & Deployment

**Vite Configuration:**
- Development server with HMR
- Production builds with optimization
- Path aliasing for clean imports
- Component tagging for debugging

**Supabase Integration:**
- Automated function deployment
- Database migration management
- Environment configuration
- Secret management

## 📈 Scalability Considerations

### Database Scalability

**Design Patterns:**
- User-based data partitioning
- Efficient indexing strategy
- Connection pooling
- Query optimization

### Application Scalability

**Frontend Patterns:**
- Component-based architecture
- Efficient state management
- Lazy loading strategies
- Caching optimization

**Backend Patterns:**
- Serverless edge functions
- Stateless operation design
- Queue-based processing
- Horizontal scaling capability

## 🔮 Technical Debt & Future Considerations

### Current Technical Debt

1. **File Length Management**: Some components approaching length limits
2. **Error Handling**: Inconsistent error patterns across components
3. **Type Safety**: Some areas need stronger TypeScript coverage
4. **Testing Coverage**: Limited automated testing infrastructure

### Architecture Evolution Path

1. **Microservices Migration**: Gradual service extraction
2. **Advanced Caching**: Redis integration for performance
3. **Real-time Collaboration**: Multi-user editing capabilities
4. **Mobile Applications**: React Native or PWA implementation

## 📋 Development Guidelines

### Code Organization Principles

1. **Separation of Concerns**: Clear boundaries between layers
2. **DRY Principle**: Reusable components and utilities
3. **Type Safety**: TypeScript for all code
4. **Performance First**: Optimized rendering and data fetching

### Best Practices

1. **Component Design**: Small, focused, reusable components
2. **Hook Usage**: Custom hooks for business logic
3. **Error Boundaries**: Comprehensive error handling
4. **Accessibility**: WCAG compliance in UI components

---

**Document Status**: Foundation v1.0
**Last Updated**: January 2025
**Next Review**: After pivot completion

This technical foundation serves as the blueprint for understanding CareerOS's core innovations and architectural decisions, providing essential context for the strategic pivot ahead.