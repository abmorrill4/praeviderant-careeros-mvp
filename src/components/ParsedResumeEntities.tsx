
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AlertCircle, CheckCircle, Clock, User, Building, Calendar, Award } from 'lucide-react';

interface ParsedResumeEntitiesProps {
  versionId: string;
  processingStatus: string;
}

export const ParsedResumeEntities: React.FC<ParsedResumeEntitiesProps> = ({
  versionId,
  processingStatus
}) => {
  // Mock data for demonstration - in real implementation this would fetch from API
  const mockEntities = {
    personal_info: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA"
    },
    experience: [
      {
        title: "Senior Software Engineer",
        company: "Tech Corp",
        duration: "2020-2023",
        description: "Led development of microservices architecture"
      },
      {
        title: "Software Engineer",
        company: "StartupXYZ",
        duration: "2018-2020",
        description: "Full-stack development using React and Node.js"
      }
    ],
    skills: ["JavaScript", "React", "Node.js", "Python", "AWS", "Docker"],
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        institution: "University of California",
        year: "2018"
      }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (processingStatus === 'processing') {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingSpinner message="Processing resume data..." />
        </CardContent>
      </Card>
    );
  }

  if (processingStatus === 'failed') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to process resume data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Extracted Resume Data
          <Badge className={getStatusColor(processingStatus)}>
            {getStatusIcon(processingStatus)}
            {processingStatus}
          </Badge>
        </CardTitle>
        <CardDescription>
          AI-extracted structured data from your resume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
            <User className="w-4 h-4" />
            Personal Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>Name:</strong> {mockEntities.personal_info.name}</div>
            <div><strong>Email:</strong> {mockEntities.personal_info.email}</div>
            <div><strong>Phone:</strong> {mockEntities.personal_info.phone}</div>
            <div><strong>Location:</strong> {mockEntities.personal_info.location}</div>
          </div>
        </div>

        <Separator />

        {/* Experience */}
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
            <Building className="w-4 h-4" />
            Work Experience
          </h4>
          <div className="space-y-3">
            {mockEntities.experience.map((exp, index) => (
              <div key={index} className="border-l-2 border-muted pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <strong className="text-sm">{exp.title}</strong>
                  <span className="text-xs text-muted-foreground">at {exp.company}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="w-3 h-3" />
                  {exp.duration}
                </div>
                <p className="text-sm text-muted-foreground">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Skills */}
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
            <Award className="w-4 h-4" />
            Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {mockEntities.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Education */}
        <div>
          <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
            <Award className="w-4 h-4" />
            Education
          </h4>
          <div className="space-y-2">
            {mockEntities.education.map((edu, index) => (
              <div key={index} className="text-sm">
                <strong>{edu.degree}</strong>
                <div className="text-muted-foreground">
                  {edu.institution} • {edu.year}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
