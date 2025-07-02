
import type { TimelineStage, ResumeTimelineData } from '@/types/resume-timeline';
import { PIPELINE_STAGES } from '@/types/resume-timeline';

export function determineStageStatus(
  stageConfig: any,
  relatedJobs: any[],
  stageLogs: any[],
  resumeVersion?: any
): {
  status: TimelineStage['status'];
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
} {
  let status: TimelineStage['status'] = 'pending';
  let startedAt: string | undefined;
  let completedAt: string | undefined;
  let errorMessage: string | undefined;

  // Determine status based on job records
  if (relatedJobs.length > 0) {
    const latestJob = relatedJobs[relatedJobs.length - 1];
    
    switch (latestJob.status) {
      case 'pending':
        status = 'pending';
        break;
      case 'processing':
      case 'in_progress':
        status = 'in_progress';
        startedAt = latestJob.started_at;
        break;
      case 'completed':
        status = 'completed';
        startedAt = latestJob.started_at;
        completedAt = latestJob.completed_at;
        break;
      case 'failed':
        status = 'failed';
        startedAt = latestJob.started_at;
        errorMessage = latestJob.error_message;
        break;
    }
  }

  // Special handling for upload stage (always completed if version exists)
  if (stageConfig.name === 'upload' && resumeVersion) {
    status = 'completed';
    startedAt = resumeVersion.created_at;
    completedAt = resumeVersion.created_at;
  }

  // Special handling for parse stage based on resume version status
  if (stageConfig.name === 'parse' && resumeVersion?.processing_status) {
    switch (resumeVersion.processing_status) {
      case 'pending':
        status = 'pending';
        break;
      case 'processing':
        status = 'in_progress';
        startedAt = resumeVersion.updated_at;
        break;
      case 'completed':
        status = 'completed';
        startedAt = resumeVersion.updated_at;
        completedAt = resumeVersion.updated_at;
        break;
      case 'failed':
        status = 'failed';
        startedAt = resumeVersion.updated_at;
        // Safely handle JSON metadata
        if (resumeVersion.resume_metadata && typeof resumeVersion.resume_metadata === 'object') {
          const metadata = resumeVersion.resume_metadata as Record<string, any>;
          errorMessage = metadata.error_message;
        }
        break;
    }
  }

  // If we have logs for this stage but no specific job status, infer from logs
  if (stageLogs.length > 0 && status === 'pending') {
    const hasError = stageLogs.some(log => log.level === 'error');
    const hasInfo = stageLogs.some(log => log.level === 'info');
    
    if (hasError) {
      status = 'failed';
      errorMessage = stageLogs.find(log => log.level === 'error')?.message;
    } else if (hasInfo) {
      status = 'completed';
    }
    
    startedAt = stageLogs[0]?.created_at;
    completedAt = stageLogs[stageLogs.length - 1]?.created_at;
  }

  return { status, startedAt, completedAt, errorMessage };
}

export function processTimelineStages(
  jobLogs: any[],
  normalizationJobs: any[],
  enrichmentJobs: any[],
  resumeVersion: any
): TimelineStage[] {
  return PIPELINE_STAGES.map(stageConfig => {
    // Filter job logs for this stage
    const stageLogs = jobLogs.filter(log => 
      log.stage === stageConfig.name
    );

    // Find related jobs based on stage
    let relatedJobs: any[] = [];
    if (stageConfig.name === 'normalize') {
      relatedJobs = normalizationJobs || [];
    } else if (stageConfig.name === 'enrich') {
      relatedJobs = enrichmentJobs || [];
    }

    const { status, startedAt, completedAt, errorMessage } = determineStageStatus(
      stageConfig, 
      relatedJobs, 
      stageLogs, 
      resumeVersion
    );

    return {
      id: stageConfig.id,
      name: stageConfig.name,
      label: stageConfig.label,
      order: stageConfig.order,
      status,
      startedAt,
      completedAt,
      duration: startedAt && completedAt ? 
        new Date(completedAt).getTime() - new Date(startedAt).getTime() : undefined,
      errorMessage,
      logs: stageLogs.map(log => ({
        id: log.id,
        job_id: log.job_id,
        stage: log.stage,
        level: log.level as 'debug' | 'info' | 'warn' | 'error',
        message: log.message,
        metadata: (log.metadata as Record<string, any>) || {},
        created_at: log.created_at,
      })),
    };
  });
}

export function determineOverallStatus(stages: TimelineStage[]): ResumeTimelineData['overallStatus'] {
  const hasError = stages.some(stage => stage.status === 'failed');
  const hasInProgress = stages.some(stage => stage.status === 'in_progress');
  const allCompleted = stages.every(stage => 
    stage.status === 'completed' || stage.status === 'skipped'
  );

  if (hasError) {
    return 'failed';
  } else if (hasInProgress) {
    return 'in_progress';
  } else if (allCompleted) {
    return 'completed';
  } else {
    return 'pending';
  }
}
