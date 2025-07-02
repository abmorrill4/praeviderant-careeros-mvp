import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, TestTube } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export const AuthTestingSuite: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<any>): Promise<TestResult> => {
    try {
      const result = await testFn();
      return {
        name: testName,
        status: 'success',
        message: 'Test passed',
        details: result,
      };
    } catch (error) {
      return {
        name: testName,
        status: 'error',
        message: error instanceof Error ? error.message : 'Test failed',
        details: error,
      };
    }
  };

  const runAllTests = async () => {
    if (!user) {
      setTests([{
        name: 'Authentication Check',
        status: 'error',
        message: 'User must be authenticated to run tests',
      }]);
      return;
    }

    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test 1: Profile exists
    const profileTest = await runTest('Profile Creation', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Profile not found');
      
      return data;
    });
    testResults.push(profileTest);

    // Test 2: Profile completeness check
    const completenessTest = await runTest('Profile Completeness Function', async () => {
      const { data, error } = await supabase.rpc('check_profile_completeness', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      return data;
    });
    testResults.push(completenessTest);

    // Test 3: Versioned entities access
    const entitiesTest = await runTest('Versioned Entities Access', async () => {
      const [workExp, education, skills] = await Promise.all([
        supabase.from('work_experience').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('education').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('skill').select('*').eq('user_id', user.id).eq('is_active', true),
      ]);

      return {
        workExperience: workExp.data?.length || 0,
        education: education.data?.length || 0,
        skills: skills.data?.length || 0,
      };
    });
    testResults.push(entitiesTest);

    // Test 4: Auth state consistency
    const authTest = await runTest('Auth State Consistency', async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) throw new Error('No session found');
      if (session.user.id !== user.id) throw new Error('Session user mismatch');
      
      return { sessionValid: true, userId: session.user.id };
    });
    testResults.push(authTest);

    setTests(testResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'error': return <Badge variant="destructive">Failed</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Authentication Testing Suite
        </CardTitle>
        <CardDescription>
          Test the authentication flow and profile creation system
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button 
          onClick={runAllTests}
          disabled={isRunning || !user}
          className="w-full"
        >
          {isRunning ? 'Running Tests...' : 'Run Authentication Tests'}
        </Button>

        {!user && (
          <Alert>
            <AlertDescription>
              Please sign in to run authentication tests
            </AlertDescription>
          </Alert>
        )}

        {tests.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results:</h4>
            {tests.map((test, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="font-medium text-sm">{test.name}</span>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">{test.message}</p>
                
                {test.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-slate-50 rounded overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};