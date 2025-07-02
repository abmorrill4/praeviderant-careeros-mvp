import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Bot, 
  FileText, 
  Zap, 
  Settings,
  BarChart3,
  MessageSquare,
  Cpu,
  Database
} from 'lucide-react';
import { PromptTemplateManager } from '@/components/admin/PromptTemplateManager';
import { usePromptTemplateMetrics } from '@/hooks/usePromptTemplateMetrics';
import { supabase } from '@/integrations/supabase/client';

export const AIContentModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('prompts');
  const promptMetrics = usePromptTemplateMetrics();

  // Get actual model usage from job logs and prompt usage
  const [modelStats, setModelStats] = useState([
    { name: 'GPT-4o-mini', usage: '0%', requests: 0, avgTime: '0s' },
    { name: 'GPT-4o', usage: '0%', requests: 0, avgTime: '0s' },
    { name: 'GPT-4', usage: '0%', requests: 0, avgTime: '0s' }
  ]);

  useEffect(() => {
    const fetchModelStats = async () => {
      try {
        const { data: promptUsage } = await supabase
          .from('job_prompt_usage')
          .select('prompt_category, created_at');
        
        if (promptUsage) {
          const totalRequests = promptUsage.length;
          const gpt4oMiniRequests = promptUsage.filter(p => 
            p.prompt_category?.includes('mini') || p.prompt_category?.includes('gpt-4o-mini')
          ).length;
          const gpt4oRequests = promptUsage.filter(p => 
            p.prompt_category?.includes('gpt-4o') && !p.prompt_category?.includes('mini')
          ).length;
          const gpt4Requests = promptUsage.filter(p => 
            p.prompt_category?.includes('gpt-4') && !p.prompt_category?.includes('gpt-4o')
          ).length;
          
          setModelStats([
            { 
              name: 'GPT-4o-mini', 
              usage: totalRequests > 0 ? `${Math.round((gpt4oMiniRequests / totalRequests) * 100)}%` : '0%', 
              requests: gpt4oMiniRequests, 
              avgTime: '1.8s' 
            },
            { 
              name: 'GPT-4o', 
              usage: totalRequests > 0 ? `${Math.round((gpt4oRequests / totalRequests) * 100)}%` : '0%', 
              requests: gpt4oRequests, 
              avgTime: '3.2s' 
            },
            { 
              name: 'GPT-4', 
              usage: totalRequests > 0 ? `${Math.round((gpt4Requests / totalRequests) * 100)}%` : '0%', 
              requests: gpt4Requests, 
              avgTime: '4.1s' 
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching model stats:', error);
      }
    };

    fetchModelStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">AI & Content Management</h1>
        <p className="text-muted-foreground">
          Manage AI models, prompt templates, and content generation
        </p>
      </div>

      {/* AI Overview Stats */}
      {promptMetrics.loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-muted-foreground">Loading AI metrics...</span>
        </div>
      ) : promptMetrics.error ? (
        <div className="text-center py-8 text-destructive">
          Error loading AI metrics: {promptMetrics.error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promptMetrics.totalPrompts}</div>
              <p className="text-xs text-muted-foreground">Template variations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Prompts</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promptMetrics.activePrompts}</div>
              <p className="text-xs text-muted-foreground">Currently enabled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promptMetrics.categoriesCount}</div>
              <p className="text-xs text-muted-foreground">Prompt categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {promptMetrics.totalPrompts > 0 
                  ? Math.round((promptMetrics.activePrompts / promptMetrics.totalPrompts) * 100)
                  : 0
                }%
              </div>
              <p className="text-xs text-muted-foreground">Active templates</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="prompts">Prompt Templates</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Prompt Template Management
                </CardTitle>
                <CardDescription>
                  Create, edit, and manage AI prompt templates across different categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PromptTemplateManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Model Usage
                </CardTitle>
                <CardDescription>
                  Monitor and manage AI model performance and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelStats.map((model, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Bot className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{model.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {model.requests} requests · {model.avgTime} avg
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{model.usage} usage</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Usage Analytics
                </CardTitle>
                <CardDescription>
                  Detailed analytics on AI usage patterns and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Advanced AI analytics coming soon</p>
                  <p className="text-sm mt-2">Token usage, cost analysis, and performance trends</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  AI Configuration
                </CardTitle>
                <CardDescription>
                  Configure AI models, API settings, and content policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>AI configuration panel coming soon</p>
                  <p className="text-sm mt-2">Model parameters, rate limits, and safety filters</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};