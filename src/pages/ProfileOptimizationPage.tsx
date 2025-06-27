
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileScoreInsights } from '@/components/profile/ProfileScoreInsights';
import { SmartWritingAssistant } from '@/components/profile/SmartWritingAssistant';
import { Wand2, TrendingUp, Target, BookOpen } from 'lucide-react';

const ProfileOptimizationPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('score');

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300`}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
            Profile Optimization
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            Enhance your profile with AI-powered insights and resume best practices
          </p>
        </div>

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
              <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
                <CardHeader>
                  <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Work Experience Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-career-background-dark/50' : 'bg-career-background-light/50'}`}>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                      Use Strong Action Verbs
                    </h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Start bullet points with powerful verbs like "achieved," "developed," "led," "implemented," or "optimized."
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-career-background-dark/50' : 'bg-career-background-light/50'}`}>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                      Quantify Your Achievements
                    </h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Include specific numbers, percentages, dollar amounts, or other metrics to demonstrate impact.
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-career-background-dark/50' : 'bg-career-background-light/50'}`}>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                      Focus on Results
                    </h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Emphasize outcomes and impacts rather than just listing responsibilities or duties.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
                <CardHeader>
                  <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Skills Section Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-career-background-dark/50' : 'bg-career-background-light/50'}`}>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                      Provide Context
                    </h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Don't just list skills—explain how you've used them and in what contexts.
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-career-background-dark/50' : 'bg-career-background-light/50'}`}>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                      Balance Technical & Soft Skills
                    </h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Include both technical competencies and interpersonal skills relevant to your target role.
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-career-background-dark/50' : 'bg-career-background-light/50'}`}>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                      Show Proficiency Levels
                    </h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
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
  );
};

export default ProfileOptimizationPage;
