
export interface TimelineStage {
  id: string;
  name: string;
  label: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  errorMessage?: string;
  logs: JobLog[];
}

export interface JobLog {
  id: string;
  job_id: string;
  stage: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ResumeTimelineData {
  resumeVersionId: string;
  userId: string;
  stages: TimelineStage[];
  overallStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  lastUpdated: string;
}

export interface TimelineFilters {
  resumeId?: string;
  userId?: string;
  status?: string;
  stage?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const PIPELINE_STAGES = [
  { id: 'upload', name: 'upload', label: 'Upload', order: 1 },
  { id: 'parse', name: 'parse', label: 'Parse', order: 2 },
  { id: 'diff', name: 'diff', label: 'Diff Analysis', order: 3 },
  { id: 'normalize', name: 'normalize', label: 'Normalize', order: 4 },
  { id: 'enrich', name: 'enrich', label: 'Enrich', order: 5 },
  { id: 'review', name: 'review', label: 'Review', order: 6 },
  { id: 'update', name: 'update', label: 'Update Profile', order: 7 },
] as const;
