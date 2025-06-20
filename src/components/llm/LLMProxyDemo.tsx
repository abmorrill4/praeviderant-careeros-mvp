
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Zap } from 'lucide-react';
import { useLLMProxy, type LLMProxyResponse } from '@/hooks/useLLMProxy';
import { useTheme } from '@/contexts/ThemeContext';

const LLMProxyDemo = () => {
  const [message, setMessage] = useState('');
  const [complexity, setComplexity] = useState<'simple' | 'complex'>('simple');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [response, setResponse] = useState<LLMProxyResponse | null>(null);
  
  const { sendRequest, isLoading } = useLLMProxy();
  const { theme } = useTheme();

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      const result = await sendRequest({
        complexity,
        messages: [{ role: 'user', content: message }],
        systemPrompt: systemPrompt.trim() || undefined
      });
      
      setResponse(result);
    } catch (error) {
      console.error('Failed to send LLM request:', error);
    }
  };

  const getComplexityIcon = (level: 'simple' | 'complex') => {
    return level === 'simple' ? <Zap className="w-4 h-4" /> : <Brain className="w-4 h-4" />;
  };

  const getComplexityColor = (level: 'simple' | 'complex') => {
    return level === 'simple' ? 'bg-green-500' : 'bg-blue-500';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardHeader>
          <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            LLM Proxy Service Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              Complexity Level
            </label>
            <Select value={complexity} onValueChange={(value: 'simple' | 'complex') => setComplexity(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span>Simple (GPT-4o Mini)</span>
                  </div>
                </SelectItem>
                <SelectItem value="complex">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <span>Complex (GPT-4o)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              System Prompt (Optional)
            </label>
            <Textarea
              placeholder="Enter system instructions for the AI..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              Your Message
            </label>
            <Textarea
              placeholder="Enter your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!message.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {getComplexityIcon(complexity)}
                <span className="ml-2">Send Request</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {response && (
        <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Response
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={getComplexityColor(response.complexity)}>
                  {getComplexityIcon(response.complexity)}
                  <span className="ml-1">{response.complexity}</span>
                </Badge>
                <Badge variant="outline">
                  {response.model}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-career-bg-dark' : 'bg-gray-50'}`}>
              <p className={`whitespace-pre-wrap ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                {response.response}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Processing Time:
                </span>
                <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  {response.metadata.processing_time_ms}ms
                </p>
              </div>
              
              {response.usage && (
                <>
                  <div>
                    <span className={`font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Prompt Tokens:
                    </span>
                    <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                      {response.usage.prompt_tokens}
                    </p>
                  </div>
                  
                  <div>
                    <span className={`font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Completion Tokens:
                    </span>
                    <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                      {response.usage.completion_tokens}
                    </p>
                  </div>
                  
                  <div>
                    <span className={`font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      Total Tokens:
                    </span>
                    <p className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                      {response.usage.total_tokens}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LLMProxyDemo;
