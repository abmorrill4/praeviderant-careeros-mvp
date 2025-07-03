import React from 'react';
import { useLocation } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface PhaseStep {
  id: string;
  label: string;
  path: string;
  completed: boolean;
  current: boolean;
}

interface Phase {
  id: 'build' | 'optimize' | 'apply';
  label: string;
  color: string;
  bgColor: string;
  steps: PhaseStep[];
  progress: number;
}

export const ProgressIndicator: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Mock completion data - this would come from user progress tracking
  const phases: Phase[] = [
    {
      id: 'build',
      label: 'Build Foundation',
      color: 'nav-build',
      bgColor: 'bg-nav-build',
      progress: 75,
      steps: [
        {
          id: 'profile-timeline',
          label: 'Profile Timeline',
          path: '/profile-timeline',
          completed: true,
          current: currentPath === '/profile-timeline'
        },
        {
          id: 'interview',
          label: 'AI Interview',
          path: '/interview',
          completed: false,
          current: currentPath === '/interview'
        }
      ]
    },
    {
      id: 'optimize',
      label: 'Optimize Profile',
      color: 'nav-optimize',
      bgColor: 'bg-nav-optimize',
      progress: 45,
      steps: [
        {
          id: 'profile-optimization',
          label: 'Profile Optimization',
          path: '/profile-optimization',
          completed: false,
          current: currentPath === '/profile-optimization'
        },
        {
          id: 'profile-management',
          label: 'Profile Management',
          path: '/profile-management',
          completed: false,
          current: currentPath === '/profile-management'
        }
      ]
    },
    {
      id: 'apply',
      label: 'Apply & Execute',
      color: 'nav-apply',
      bgColor: 'bg-nav-apply',
      progress: 10,
      steps: [
        {
          id: 'application-toolkit',
          label: 'Application Toolkit',
          path: '/application-toolkit',
          completed: false,
          current: currentPath === '/application-toolkit'
        }
      ]
    }
  ];

  const currentPhase = phases.find(phase => 
    phase.steps.some(step => step.current)
  ) || phases[0];

  const overallProgress = phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-card-foreground">Career Profile Progress</h3>
          <Badge variant="secondary">{Math.round(overallProgress)}% Complete</Badge>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          Complete all phases to unlock full career potential
        </p>
      </div>

      {/* Phase Progress */}
      <div className="grid gap-3">
        {phases.map((phase) => {
          const isCurrentPhase = phase.id === currentPhase.id;
          
          return (
            <div 
              key={phase.id}
              className={`
                rounded-lg border transition-all duration-200
                ${isCurrentPhase 
                  ? 'bg-card border-primary/50 shadow-sm' 
                  : 'bg-muted/30 border-border/50'
                }
              `}
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${phase.bgColor}`} />
                    <span className={`font-medium ${isCurrentPhase ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {phase.label}
                    </span>
                  </div>
                  <Badge 
                    variant={isCurrentPhase ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {phase.progress}%
                  </Badge>
                </div>
                
                <Progress 
                  value={phase.progress} 
                  className={`h-1.5 ${isCurrentPhase ? '' : 'opacity-60'}`}
                />
                
                {/* Steps */}
                <div className="mt-3 space-y-1">
                  {phase.steps.map((step) => (
                    <div 
                      key={step.id}
                      className={`
                        flex items-center space-x-2 text-sm
                        ${step.current ? 'text-primary font-medium' : ''}
                        ${step.completed ? 'text-muted-foreground' : ''}
                      `}
                    >
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : step.current ? (
                        <ArrowRight className="w-4 h-4 text-primary" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Steps */}
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
        <h4 className="font-medium text-foreground mb-2">Next Steps</h4>
        <p className="text-sm text-muted-foreground">
          Continue building your profile foundation by completing the AI Interview process.
        </p>
      </div>
    </div>
  );
};

export default ProgressIndicator;