import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  phase?: 'build' | 'optimize' | 'apply';
}

const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/profile-timeline': [
    { label: 'Build', phase: 'build' },
    { label: 'Profile Timeline' }
  ],
  '/interview': [
    { label: 'Build', phase: 'build' },
    { label: 'AI Interview' }
  ],
  '/profile-optimization': [
    { label: 'Optimize', phase: 'optimize' },
    { label: 'Profile Optimization' }
  ],
  '/profile-management': [
    { label: 'Optimize', phase: 'optimize' },
    { label: 'Profile Management' }
  ],
  '/application-toolkit': [
    { label: 'Apply', phase: 'apply' },
    { label: 'Application Toolkit' }
  ],
  '/admin': [
    { label: 'Administration' }
  ]
};

const phaseColors = {
  build: 'text-nav-build',
  optimize: 'text-nav-optimize',
  apply: 'text-nav-apply'
};

export const BreadcrumbNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const breadcrumbs = routeMapping[location.pathname] || [];
  
  if (breadcrumbs.length === 0) return null;

  return (
    <div className="px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => navigate('/profile-timeline')}
              className="flex items-center cursor-pointer hover:text-primary transition-colors"
            >
              <Home className="w-4 h-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbSeparator>
                <ChevronRight className="w-4 h-4" />
              </BreadcrumbSeparator>
              
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage className="font-medium">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink 
                    onClick={() => item.path && navigate(item.path)}
                    className={`
                      cursor-pointer hover:text-primary transition-colors
                      ${item.phase ? phaseColors[item.phase] : ''}
                    `}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default BreadcrumbNavigation;