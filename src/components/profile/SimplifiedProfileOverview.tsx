
import React from 'react';
import { useUnifiedProfileData } from '@/hooks/useUnifiedProfileData';
import { ProfileMetricsGrid } from './ProfileMetricsGrid';
import { CurrentRoleCard } from './CurrentRoleCard';
import { AIInsightsPanel } from './AIInsightsPanel';
import { RecentActivityCard } from './RecentActivityCard';
import { SkillsOverviewCard } from './SkillsOverviewCard';
import '../../styles/neoskeumorphic.css';

export const SimplifiedProfileOverview: React.FC = () => {
  const profileData = useUnifiedProfileData();

  if (profileData.isLoading) {
    return (
      <div className="neo-backdrop p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="neo-card p-6 animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-backdrop p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="neo-section">
          <h1 className="text-3xl font-bold neo-text mb-2">
            Career Profile
          </h1>
          <p className="neo-text-muted">
            Your professional journey with AI-powered insights
          </p>
        </div>

        {/* Metrics Grid */}
        <ProfileMetricsGrid data={profileData} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <CurrentRoleCard currentRole={profileData.metrics.currentRole} />
            <SkillsOverviewCard skills={profileData.skills} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <AIInsightsPanel 
              careerEnrichment={profileData.careerEnrichment}
              narratives={profileData.careerNarratives}
            />
            <RecentActivityCard data={profileData} />
          </div>
        </div>
      </div>
    </div>
  );
};
