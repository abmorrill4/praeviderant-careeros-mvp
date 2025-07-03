
import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileScoreInsights } from '@/components/profile/ProfileScoreInsights';
import { SmartWritingAssistant } from '@/components/profile/SmartWritingAssistant';
import { CleanNavigation } from '@/components/navigation/CleanNavigation';
import { BreadcrumbNavigation } from '@/components/navigation/BreadcrumbNavigation';
import { Wand2, TrendingUp, Target, BookOpen } from 'lucide-react';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

const ProfileOptimizationPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<TimelineSection>('overview');
  const [activeTab, setActiveTab] = useState('score');

  return (
    <CleanNavigation>
      <BreadcrumbNavigation />
      <div className="h-full flex flex-col">
        <div className="bg-white border-b p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Optimization
          </h1>
          <p className="text-gray-600">
            Enhance your profile with AI-powered insights and resume best practices
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="score" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Score Analysis
              </TabsTrigger>
              <TabsTrigger value="writing" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Writing Assistant
              </TabsTrigger>
              <TabsTrigger value="guidance" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Best Practices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="score" className="space-y-6">
              <ProfileScoreInsights />
            </TabsContent>

            <TabsContent value="writing" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SmartWritingAssistant 
                  context="work_experience"
                  onTextImproved={(text) => console.log('Work experience improved:', text)}
                />
                <SmartWritingAssistant 
                  context="skill"
                  onTextImproved={(text) => console.log('Skill improved:', text)}
                />
              </div>
              <SmartWritingAssistant 
                context="education"
                onTextImproved={(text) => console.log('Education improved:', text)}
              />
            </TabsContent>

            <TabsContent value="guidance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">
                      Work Experience Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Use Strong Action Verbs
                      </h4>
                      <p className="text-sm text-gray-600">
                        Start bullet points with powerful verbs like "achieved," "developed," "led," "implemented," or "optimized."
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Quantify Your Achievements
                      </h4>
                      <p className="text-sm text-gray-600">
                        Include specific numbers, percentages, dollar amounts, or other metrics to demonstrate impact.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Focus on Results
                      </h4>
                      <p className="text-sm text-gray-600">
                        Emphasize outcomes and impacts rather than just listing responsibilities or duties.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">
                      Skills Section Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Provide Context
                      </h4>
                      <p className="text-sm text-gray-600">
                        Don't just list skills—explain how you've used them and in what contexts.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Balance Technical & Soft Skills
                      </h4>
                      <p className="text-sm text-gray-600">
                        Include both technical competencies and interpersonal skills relevant to your target role.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Show Proficiency Levels
                      </h4>
                      <p className="text-sm text-gray-600">
                        Indicate your level of expertise and years of experience with each skill.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CleanNavigation>
  );
};

export default ProfileOptimizationPage;
