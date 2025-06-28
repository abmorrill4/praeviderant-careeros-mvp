
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Award,
  ArrowRight,
  CheckCircle,
  Circle,
  Lightbulb
} from 'lucide-react';
import { ResumeUploadModal } from './ResumeUploadModal';
import { useNavigate } from 'react-router-dom';

interface NewUserGuidanceProps {
  hasResumeData: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
}

export const NewUserGuidance: React.FC<NewUserGuidanceProps> = ({
  hasResumeData,
  hasExperience,
  hasEducation,
  hasSkills
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Calculate completion percentage
  const completedItems = [hasResumeData, hasExperience, hasEducation, hasSkills].filter(Boolean).length;
  const completionPercentage = (completedItems / 4) * 100;

  const quickActions = [
    {
      id: 'upload-resume',
      title: 'Upload Your Resume',
      description: 'Quick start by uploading your existing resume to auto-populate your profile',
      icon: Upload,
      completed: hasResumeData,
      primary: true,
      component: <ResumeUploadModal />
    },
    {
      id: 'add-experience',
      title: 'Add Work Experience',
      description: 'Manually enter your work history and achievements',
      icon: Briefcase,
      completed: hasExperience,
      onClick: () => navigate('/profile-timeline?section=experience')
    },
    {
      id: 'add-education',
      title: 'Add Education',
      description: 'Include your educational background and certifications',
      icon: GraduationCap,
      completed: hasEducation,
      onClick: () => navigate('/profile-timeline?section=education')
    },
    {
      id: 'add-skills',
      title: 'List Your Skills',
      description: 'Showcase your technical and soft skills',
      icon: Award,
      completed: hasSkills,
      onClick: () => navigate('/profile-timeline?section=skills')
    }
  ];

  const recommendations = [
    {
      title: "Start with your resume",
      description: "Upload an existing resume to automatically extract your work experience, education, and skills. This is the fastest way to get started.",
      priority: "high"
    },
    {
      title: "Complete all sections",
      description: "A complete profile helps our AI provide better resume optimization and job matching recommendations.",
      priority: "medium"
    },
    {
      title: "Use specific details",
      description: "Include quantified achievements (e.g., 'Increased sales by 25%') and specific technologies you've used.",
      priority: "medium"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className={`${theme === 'dark' ? 'bg-gradient-to-r from-career-panel-dark to-blue-900/20 border-career-text-dark/20' : 'bg-gradient-to-r from-career-panel-light to-blue-50 border-career-text-light/20'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-xl ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Welcome to Your Career Timeline! 🚀
              </CardTitle>
              <p className={`mt-2 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Let's build your professional profile to unlock personalized career insights and opportunities.
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${completionPercentage >= 50 ? 'text-green-600' : 'text-yellow-600'}`}>
                {completionPercentage.toFixed(0)}%
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Complete
              </p>
            </div>
          </div>
          <Progress value={completionPercentage} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            <Lightbulb className="w-5 h-5" />
            Quick Start Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <div
                  key={action.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    action.completed 
                      ? `${theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`
                      : `${theme === 'dark' ? 'border-career-gray-dark hover:border-career-accent' : 'border-career-gray-light hover:border-career-accent'} hover:shadow-md`
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      action.completed 
                        ? 'bg-green-600 text-white' 
                        : `${theme === 'dark' ? 'bg-career-accent/20 text-career-accent' : 'bg-career-accent/10 text-career-accent'}`
                    }`}>
                      {action.completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <IconComponent className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                          {action.title}
                        </h3>
                        {action.completed && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Done
                          </Badge>
                        )}
                        {action.primary && !action.completed && (
                          <Badge className="bg-career-accent text-white">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                        {action.description}
                      </p>
                      {!action.completed && (
                        <div>
                          {action.component ? (
                            action.component
                          ) : (
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={action.onClick}
                              className="flex items-center gap-2"
                            >
                              Get Started
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            <FileText className="w-5 h-5" />
            Pro Tips for Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  rec.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <h4 className={`font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    {rec.title}
                  </h4>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    {rec.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      {completionPercentage > 0 && completionPercentage < 100 && (
        <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
          <CardHeader>
            <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              You're Making Progress! 🎯
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Great start! Complete the remaining sections to unlock advanced features like:
            </p>
            <ul className={`space-y-2 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              <li className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-current" />
                AI-powered resume optimization suggestions
              </li>
              <li className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-current" />
                Job description matching and scoring
              </li>
              <li className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-current" />
                Personalized interview preparation
              </li>
              <li className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-current" />
                Career gap analysis and recommendations
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
