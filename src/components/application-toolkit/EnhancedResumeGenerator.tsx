import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Settings, 
  Target, 
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useResumeGeneration } from '@/hooks/useResumeGeneration';
import type { 
  ResumePersonalization, 
  ResumeFormat, 
  ResumeStyle,
  GeneratedResume,
  ExtractedJobData 
} from '@/types/resume-generation';

interface EnhancedResumeGeneratorProps {
  onResumeGenerated?: (resume: GeneratedResume) => void;
}

export const EnhancedResumeGenerator: React.FC<EnhancedResumeGeneratorProps> = ({
  onResumeGenerated
}) => {
  const { 
    generateResume, 
    extractJobFromUrl, 
    exportResume, 
    analyzeJobMatch, 
    isGenerating, 
    isExtracting, 
    isExporting, 
    error, 
    progress 
  } = useResumeGeneration();
  
  // Form state
  const [inputMode, setInputMode] = useState<'manual' | 'url'>('manual');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [extractedJob, setExtractedJob] = useState<ExtractedJobData | null>(null);
  
  // Personalization state
  const [personalization, setPersonalization] = useState<ResumePersonalization>({
    tone: 'professional',
    focus: 'experience',
  });
  
  // Format and style state
  const [format, setFormat] = useState<ResumeFormat>({
    type: 'pdf',
    pageSize: 'A4',
    margins: 'normal',
    fontSize: 'medium',
  });
  
  const [style, setStyle] = useState<ResumeStyle>({
    template: 'classic',
    colorScheme: 'classic',
    layout: 'single-column',
    font: 'sans-serif',
  });

  // Generated resume state
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);

  const handleExtractFromUrl = async () => {
    if (!jobUrl.trim()) {
      return;
    }

    const extracted = await extractJobFromUrl(jobUrl);
    if (extracted) {
      setExtractedJob(extracted);
      setJobDescription(extracted.description);
      setTargetRole(extracted.title);
      setCompanyName(extracted.company);
      setInputMode('manual'); // Switch to manual mode to show extracted data
    }
  };

  const handleGenerate = async () => {
    const description = inputMode === 'url' && extractedJob 
      ? extractedJob.description 
      : jobDescription;
      
    if (!description.trim()) {
      return;
    }

    const request = {
      jobDescription: description,
      personalizations: {
        ...personalization,
        targetRole: targetRole || extractedJob?.title || undefined,
        companyName: companyName || extractedJob?.company || undefined,
        customObjective: customObjective || undefined,
      },
      format,
      style,
    };

    const result = await generateResume(request);
    if (result) {
      setGeneratedResume(result);
      onResumeGenerated?.(result);
    }
  };

  const handleExport = async (exportFormat: ResumeFormat) => {
    if (!generatedResume) return;
    
    const result = await exportResume(generatedResume.id, exportFormat);
    if (result) {
      // Create download link
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleAnalyze = async () => {
    if (!generatedResume) return;
    await analyzeJobMatch(generatedResume.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-career-panel border-career-text/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-career-text">
            <Sparkles className="w-5 h-5 text-career-accent" />
            Enhanced Resume Generator
          </CardTitle>
          <CardDescription className="text-career-text-muted">
            AI-powered resume generation with multi-pass optimization and personalization
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Job Input Section */}
      <Card className="bg-career-panel border-career-text/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-career-text">
            <Target className="w-5 h-5" />
            Job Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={inputMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setInputMode('manual')}
              className="flex-1"
            >
              Manual Entry
            </Button>
            <Button
              variant={inputMode === 'url' ? 'default' : 'outline'}
              onClick={() => setInputMode('url')}
              className="flex-1"
            >
              Extract from URL
            </Button>
          </div>

          {inputMode === 'url' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="job-url" className="text-career-text">
                  Job Posting URL *
                </Label>
                <Input
                  id="job-url"
                  type="url"
                  placeholder="https://example.com/job-posting"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>
              
              <Button
                onClick={handleExtractFromUrl}
                disabled={!jobUrl.trim() || isExtracting}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting Job Details...
                  </>
                ) : (
                  'Extract Job Details'
                )}
              </Button>

              {extractedJob && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800">Extracted Job Details:</h4>
                  <p className="text-green-700">
                    <strong>{extractedJob.title}</strong> at <strong>{extractedJob.company}</strong>
                  </p>
                  {extractedJob.location && (
                    <p className="text-green-600">Location: {extractedJob.location}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="job-description" className="text-career-text">
                Paste the job description here *
              </Label>
              <Textarea
                id="job-description"
                placeholder="Paste the complete job description..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] mt-2"
                required
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target-role" className="text-career-text">
                  Target Role (Optional)
                </Label>
                <Input
                  id="target-role"
                  placeholder="e.g., Senior Software Engineer"
                  value={targetRole || extractedJob?.title || ''}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="company-name" className="text-career-text">
                  Company Name (Optional)
                </Label>
                <Input
                  id="company-name"
                  placeholder="e.g., Google"
                  value={companyName || extractedJob?.company || ''}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-2"
                />
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalization Options */}
      <Card className="bg-career-panel border-career-text/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-career-text">
            <Settings className="w-5 h-5" />
            Personalization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-career-text">Tone</Label>
              <Select
                value={personalization.tone}
                onValueChange={(value: any) => 
                  setPersonalization(prev => ({ ...prev, tone: value }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-career-text">Focus Area</Label>
              <Select
                value={personalization.focus}
                onValueChange={(value: any) => 
                  setPersonalization(prev => ({ ...prev, focus: value }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="custom-objective" className="text-career-text">
              Custom Objective (Optional)
            </Label>
            <Textarea
              id="custom-objective"
              placeholder="Write a custom career objective or let AI generate one..."
              value={customObjective}
              onChange={(e) => setCustomObjective(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Extraction Progress */}
      {isExtracting && (
        <Card className="bg-career-panel border-career-text/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-career-accent" />
                <span className="text-career-text">Extracting job details from URL...</span>
              </div>
              <div className="text-sm text-career-text-muted">
                AI is analyzing the job posting to extract key information
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Progress */}
      {isGenerating && (
        <Card className="bg-career-panel border-career-text/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-career-accent" />
                <span className="text-career-text">Generating your tailored resume...</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-sm text-career-text-muted">
                Using multi-pass AI optimization for best results
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={
            (inputMode === 'manual' && !jobDescription.trim()) || 
            (inputMode === 'url' && !extractedJob) ||
            isGenerating || 
            isExtracting
          }
          className="bg-career-accent hover:bg-career-accent/80 text-white px-8 py-3 text-lg"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : isExtracting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Tailored Resume
            </>
          )}
        </Button>
      </div>

      {/* Generated Resume Display */}
      {generatedResume && (
        <Card className="bg-career-panel border-career-text/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-career-text">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Resume Generated Successfully
            </CardTitle>
            <CardDescription className="text-career-text-muted">
              Your tailored resume is ready. Choose export format below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Options */}
            <div>
              <Label className="text-career-text">Export Formats</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {[
                  { type: 'pdf', label: 'PDF', icon: FileText },
                  { type: 'docx', label: 'Word', icon: FileText },
                  { type: 'html', label: 'HTML', icon: FileText },
                  { type: 'markdown', label: 'Markdown', icon: FileText },
                ].map(({ type, label, icon: Icon }) => (
                  <Button
                    key={type}
                    variant="outline"
                    onClick={() => handleExport({ ...format, type: type as any })}
                    disabled={isExporting}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Analytics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-career-text">Match Score</span>
                <Badge variant="secondary">
                  {generatedResume.metadata.analytics.matchScore}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-career-text">Keyword Alignment</span>
                <Badge variant="secondary">
                  {generatedResume.metadata.analytics.keywordAlignment}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-career-text">Completeness</span>
                <Badge variant="secondary">
                  {generatedResume.metadata.analytics.completeness}%
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              variant="outline"
              className="w-full"
              disabled={isExporting}
            >
              <Target className="w-4 h-4 mr-2" />
              Analyze Job Match
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};