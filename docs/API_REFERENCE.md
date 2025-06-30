
# CareerOS API Reference

## Overview

CareerOS uses Supabase Edge Functions for backend API endpoints. All APIs require authentication unless specifically noted as public.

## Authentication

All API requests must include a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

Tokens are obtained through Supabase Auth and are automatically handled by the client SDK.

## Base URL

```
https://deofbwuazrvpocyybjpl.supabase.co/functions/v1/
```

## Edge Functions

### Resume Upload & Processing

#### `POST /resume-upload-v2`

Upload and process a resume file.

**Request:**
```http
POST /functions/v1/resume-upload-v2
Content-Type: multipart/form-data

{
  "file": <File>,
  "streamName": "Resume Upload"
}
```

**Response:**
```json
{
  "success": true,
  "versionId": "uuid",
  "isDuplicate": false,
  "message": "Resume uploaded successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Upload failed",
  "details": "Specific error message"
}
```

#### `POST /parse-resume-structured`

Parse resume content into structured data.

**Request:**
```json
{
  "resume_version_id": "uuid",
  "content": "resume text content"
}
```

**Response:**
```json
{
  "entities": {
    "work_experience": [...],
    "education": [...],
    "skills": [...],
    "projects": [...],
    "certifications": [...]
  },
  "metadata": {
    "processing_time": "2.5s",
    "confidence_score": 0.85
  }
}
```

### AI Interview System

#### `POST /create-interview-session`

Create a new AI interview session.

**Request:**
```json
{
  "interview_type": "career_overview",
  "context": "optional context"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "openAISessionId": "session_xyz",
  "clientSecret": "encrypted_secret",
  "systemPrompt": "interview instructions"
}
```

#### `POST /transcribe-audio`

Transcribe audio content to text.

**Request:**
```http
Content-Type: multipart/form-data

{
  "audio": <AudioFile>,
  "session_id": "uuid"
}
```

**Response:**
```json
{
  "transcript": "transcribed text",
  "confidence": 0.95,
  "duration": 45.2
}
```

### Resume Generation

#### `POST /generate-tailored-resume`

Generate a tailored resume based on job description.

**Request:**
```json
{
  "job_description": "job posting text",
  "user_profile": {
    "work_experience": [...],
    "education": [...],
    "skills": [...]
  },
  "format": "markdown",
  "style": "professional"
}
```

**Response:**
```json
{
  "resume_content": "# John Doe\n\n## Experience\n...",
  "tailoring_notes": [
    "Emphasized Python skills for backend role",
    "Highlighted project management experience"
  ],
  "match_score": 0.87
}
```

#### `POST /generate-tailored-cover-letter`

Generate a personalized cover letter.

**Request:**
```json
{
  "job_description": "job posting text",
  "company_info": {
    "name": "Company Name",
    "industry": "Technology"
  },
  "user_profile": {...},
  "tone": "professional"
}
```

**Response:**
```json
{
  "cover_letter": "Dear Hiring Manager,\n\n...",
  "key_points": [
    "Relevant experience highlighted",
    "Company mission alignment"
  ]
}
```

#### `POST /generate-resume-pdf`

Convert resume content to PDF format.

**Request:**
```json
{
  "content": "markdown content",
  "template": "modern",
  "options": {
    "font_size": 11,
    "margins": "normal"
  }
}
```

**Response:**
```json
{
  "pdf_url": "https://storage.supabase.co/...",
  "download_token": "temp_token_xyz",
  "expires_at": "2024-01-01T00:00:00Z"
}
```

### Data Enrichment

#### `POST /enrich-resume`

Enrich resume data with AI analysis.

**Request:**
```json
{
  "resume_version_id": "uuid",
  "enrichment_types": [
    "career_narrative",
    "skill_analysis",
    "achievement_enhancement"
  ]
}
```

**Response:**
```json
{
  "enrichment_id": "uuid",
  "status": "processing",
  "estimated_completion": "2024-01-01T00:05:00Z"
}
```

#### `POST /enrich-resume-entries`

Bulk enrich multiple resume entries.

**Request:**
```json
{
  "entry_ids": ["uuid1", "uuid2", "uuid3"],
  "enrichment_config": {
    "include_context": true,
    "enhance_descriptions": true
  }
}
```

**Response:**
```json
{
  "job_id": "uuid",
  "entries_queued": 3,
  "status": "processing"
}
```

### Profile Management

#### `POST /apply-resume-data-to-profile`

Apply parsed resume data to user profile.

**Request:**
```json
{
  "resume_version_id": "uuid",
  "merge_strategy": "smart_merge",
  "conflict_resolution": "prefer_newer"
}
```

**Response:**
```json
{
  "applied_entities": {
    "work_experience": 3,
    "education": 2,
    "skills": 15
  },
  "conflicts_resolved": 2,
  "profile_updated": true
}
```

#### `POST /create-merge-decision`

Create merge decisions for duplicate entities.

**Request:**
```json
{
  "entity_type": "work_experience",
  "source_id": "uuid",
  "target_id": "uuid",
  "decision": "merge",
  "field_preferences": {
    "title": "source",
    "description": "target"
  }
}
```

**Response:**
```json
{
  "decision_id": "uuid",
  "status": "pending_application",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Data Analysis

#### `POST /analyze-resume-diffs`

Analyze differences between resume versions.

**Request:**
```json
{
  "version_a": "uuid",
  "version_b": "uuid",
  "analysis_type": "comprehensive"
}
```

**Response:**
```json
{
  "differences": [
    {
      "field": "work_experience.title",
      "change_type": "modified",
      "old_value": "Software Developer",
      "new_value": "Senior Software Developer"
    }
  ],
  "similarity_score": 0.92,
  "recommendation": "Version B shows career progression"
}
```

### Utility Functions

#### `POST /encrypt-data`

Encrypt sensitive data for storage.

**Request:**
```json
{
  "data": "sensitive information",
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "encrypted_id": "uuid",
  "success": true
}
```

#### `POST /decrypt-data`

Decrypt previously encrypted data.

**Request:**
```json
{
  "encrypted_id": "uuid"
}
```

**Response:**
```json
{
  "data": "decrypted information",
  "success": true
}
```

#### `POST /llm-proxy`

Proxy requests to various LLM providers.

**Request:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "messages": [...],
  "temperature": 0.7
}
```

**Response:**
```json
{
  "response": "AI generated response",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200
  }
}
```

## Error Handling

### Standard Error Format

All API endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "resume_version_id",
      "issue": "UUID format required"
    },
    "request_id": "req_xyz123"
  }
}
```

### Common Error Codes

- `AUTHENTICATION_ERROR` (401): Invalid or missing JWT token
- `AUTHORIZATION_ERROR` (403): Insufficient permissions
- `VALIDATION_ERROR` (400): Invalid request parameters
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server-side error
- `SERVICE_UNAVAILABLE` (503): External service unavailable

### Rate Limiting

API endpoints have the following rate limits:

- **Upload endpoints**: 10 requests per minute per user
- **AI generation**: 5 requests per minute per user
- **General APIs**: 100 requests per minute per user
- **Real-time endpoints**: 1000 requests per minute per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Events

### Real-time Updates

Connect to real-time updates via Supabase subscriptions:

```javascript
supabase
  .channel('profile_updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'work_experience',
    filter: `user_id=eq.${userId}`
  }, handleProfileUpdate)
  .subscribe()
```

### Interview Session Events

Real-time interview session updates:

```javascript
supabase
  .channel(`interview_${sessionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'interview_transcripts'
  }, handleTranscriptUpdate)
  .subscribe()
```

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
import { supabase } from '@/integrations/supabase/client';

// Upload resume
const uploadResume = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('streamName', 'Resume Upload');
  
  const { data, error } = await supabase.functions.invoke('resume-upload-v2', {
    body: formData,
  });
  
  return { data, error };
};

// Generate tailored resume
const generateResume = async (jobDescription: string) => {
  const { data, error } = await supabase.functions.invoke('generate-tailored-resume', {
    body: {
      job_description: jobDescription,
      format: 'markdown',
      style: 'professional'
    }
  });
  
  return { data, error };
};
```

### React Hook Example

```typescript
import { useMutation } from '@tanstack/react-query';

export const useResumeUpload = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data, error } = await supabase.functions.invoke('resume-upload-v2', {
        body: formData,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Upload successful:', data);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    }
  });
};
```

## Testing

### API Testing

Use the following curl commands to test endpoints:

```bash
# Upload resume
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@resume.pdf" \
  -F "streamName=Test Upload" \
  https://deofbwuazrvpocyybjpl.supabase.co/functions/v1/resume-upload-v2

# Generate resume
curl -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_description":"Software Engineer position..."}' \
  https://deofbwuazrvpocyybjpl.supabase.co/functions/v1/generate-tailored-resume
```

For more detailed testing examples, see the [Testing Guide](./development/testing.md).
