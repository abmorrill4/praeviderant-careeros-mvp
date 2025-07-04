// Resume Generation Types

export interface ResumeGenerationRequest {
  userId: string;
  jobDescription?: string;
  jobUrl?: string;
  personalizations?: ResumePersonalization;
  format?: ResumeFormat;
  style?: ResumeStyle;
}

// URL Job Extraction Types
export interface JobExtractionRequest {
  url: string;
  userId: string;
}

export interface ExtractedJobData {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  skills: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: 'hourly' | 'monthly' | 'yearly';
  };
  benefits?: string[];
  workType?: 'remote' | 'hybrid' | 'onsite';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  industry?: string;
  extractedAt: string;
}

export interface JobExtractionResult {
  success: boolean;
  data?: ExtractedJobData;
  error?: string;
  confidence: number;
}

export interface ResumePersonalization {
  tone?: 'professional' | 'conversational' | 'technical' | 'creative';
  focus?: 'experience' | 'skills' | 'education' | 'projects';
  targetRole?: string;
  industry?: string;
  companyName?: string;
  customObjective?: string;
}

export interface ResumeFormat {
  type: 'pdf' | 'docx' | 'html' | 'markdown' | 'txt' | 'json';
  pageSize?: 'A4' | 'Letter';
  margins?: 'normal' | 'narrow' | 'wide';
  fontSize?: 'small' | 'medium' | 'large';
}

export interface ResumeStyle {
  template: string; // Template identifier
  colorScheme?: 'classic' | 'modern' | 'minimal' | 'creative';
  layout?: 'single-column' | 'two-column' | 'sidebar';
  font?: 'serif' | 'sans-serif' | 'monospace';
}

export interface GeneratedResume {
  id: string;
  userId: string;
  jobDescription: string;
  content: JSONResumeFormat;
  metadata: ResumeMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeMetadata {
  generation: {
    model: string;
    version: string;
    processingTime: number;
    passes: number;
  };
  personalization: ResumePersonalization;
  format: ResumeFormat;
  style: ResumeStyle;
  analytics: {
    matchScore: number;
    keywordAlignment: number;
    completeness: number;
  };
}

// JSON Resume Format (standard schema)
export interface JSONResumeFormat {
  basics: {
    name: string;
    label?: string;
    image?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
      address?: string;
      postalCode?: string;
      city?: string;
      countryCode?: string;
      region?: string;
    };
    profiles?: Array<{
      network: string;
      username: string;
      url: string;
    }>;
  };
  work: Array<{
    name: string;
    position: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  volunteer?: Array<{
    organization: string;
    position: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education: Array<{
    institution: string;
    area?: string;
    studyType: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    courses?: string[];
  }>;
  awards?: Array<{
    title: string;
    date?: string;
    awarder: string;
    summary?: string;
  }>;
  certificates?: Array<{
    name: string;
    date?: string;
    issuer: string;
    url?: string;
  }>;
  publications?: Array<{
    name: string;
    publisher: string;
    releaseDate?: string;
    url?: string;
    summary?: string;
  }>;
  skills: Array<{
    name: string;
    level?: string;
    keywords?: string[];
  }>;
  languages?: Array<{
    language: string;
    fluency: string;
  }>;
  interests?: Array<{
    name: string;
    keywords?: string[];
  }>;
  references?: Array<{
    name: string;
    reference: string;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
    roles?: string[];
    entity?: string;
    type?: string;
  }>;
}

// Multi-pass generation pipeline
export interface GenerationPipeline {
  passes: GenerationPass[];
  currentPass: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results: Record<string, any>;
}

export interface GenerationPass {
  id: string;
  name: string;
  model: 'gpt-4o' | 'o3';
  purpose: string;
  prompt: string;
  functionCalls?: boolean;
  dependencies?: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  processingTime?: number;
}

// Export formats
export interface ExportResult {
  format: ResumeFormat;
  content: string | Buffer;
  fileName: string;
  mimeType: string;
  size: number;
}

// Generation analytics
export interface GenerationAnalytics {
  jobAnalysis: {
    keyRequirements: string[];
    skillsRequired: string[];
    experienceLevel: string;
    industry: string;
  };
  matchAnalysis: {
    overallScore: number;
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    keywordDensity: number;
  };
  optimizations: {
    suggestedImprovements: string[];
    missingKeywords: string[];
    strengthsHighlighted: string[];
  };
}