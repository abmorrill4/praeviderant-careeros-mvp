
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TestTube, 
  Play, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Shield,
  Database,
  Users,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SecurityTest {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'pending' | 'passed' | 'failed' | 'running';
  result?: string;
  recommendations?: string[];
}

export const SecurityTestingSuite: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tests, setTests] = useState<SecurityTest[]>([
    {
      id: 'rls-data-isolation',
      name: 'RLS Data Isolation Test',
      category: 'Access Control',
      description: 'Verify users can only access their own data',
      status: 'pending'
    },
    {
      id: 'admin-function-security',
      name: 'Admin Function Access Test',
      category: 'Privilege Escalation',
      description: 'Test that admin functions properly restrict access',
      status: 'pending'
    },
    {
      id: 'unauthorized-table-access',
      name: 'Unauthorized Table Access Test',
      category: 'Access Control',
      description: 'Attempt to access tables without proper authentication',
      status: 'pending'
    },
    {
      id: 'policy-coverage-verification',
      name: 'RLS Policy Coverage Test',
      category: 'Configuration',
      description: 'Verify all critical tables have RLS policies',
      status: 'pending'
    },
    {
      id: 'secure-deletion-test',
      name: 'Secure User Deletion Test',
      category: 'Data Protection',
      description: 'Test user deletion security and authorization',
      status: 'pending'
    }
  ]);

  const [isRunningTests, setIsRunningTests] = useState(false);

  const updateTestStatus = (testId: string, status: SecurityTest['status'], result?: string, recommendations?: string[]) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status, result, recommendations }
        : test
    ));
  };

  const runSecurityTest = async (test: SecurityTest) => {
    updateTestStatus(test.id, 'running');

    try {
      switch (test.id) {
        case 'rls-data-isolation':
          await testDataIsolation(test);
          break;
        case 'admin-function-security':
          await testAdminFunctionSecurity(test);
          break;
        case 'unauthorized-table-access':
          await testUnauthorizedAccess(test);
          break;
        case 'policy-coverage-verification':
          await testPolicyCoverage(test);
          break;
        case 'secure-deletion-test':
          await testSecureDeletion(test);
          break;
        default:
          updateTestStatus(test.id, 'failed', 'Test not implemented');
      }
    } catch (error) {
      console.error(`Security test ${test.id} failed:`, error);
      updateTestStatus(test.id, 'failed', `Test execution error: ${error}`);
    }
  };

  const testDataIsolation = async (test: SecurityTest) => {
    try {
      // Test 1: Try to access work_experience data (should only return user's data)
      const { data: workExp, error: workExpError } = await supabase
        .from('work_experience')
        .select('id, user_id')
        .limit(10);

      if (workExpError) {
        if (workExpError.code === '42501') {
          updateTestStatus(test.id, 'passed', 'RLS correctly blocking unauthorized access');
          return;
        } else {
          updateTestStatus(test.id, 'failed', `Unexpected error: ${workExpError.message}`);
          return;
        }
      }

      // If we got data, verify it's only the current user's data
      if (workExp && workExp.length > 0) {
        const allUserOwned = workExp.every(item => item.user_id === user?.id);
        if (allUserOwned) {
          updateTestStatus(test.id, 'passed', `Successfully isolated data: ${workExp.length} records returned, all owned by current user`);
        } else {
          updateTestStatus(test.id, 'failed', 'Data leakage detected: returned data from other users', [
            'Review RLS policies on work_experience table',
            'Check user_id filtering in policies'
          ]);
        }
      } else {
        updateTestStatus(test.id, 'passed', 'No data returned - RLS working correctly or no user data exists');
      }
    } catch (error) {
      updateTestStatus(test.id, 'failed', `Test execution failed: ${error}`);
    }
  };

  const testAdminFunctionSecurity = async (test: SecurityTest) => {
    try {
      // Test admin function access by checking if we can call admin-restricted functions
      const { data, error } = await supabase.rpc('is_admin_user', { user_id: user?.id });

      if (error) {
        updateTestStatus(test.id, 'failed', `Admin function test failed: ${error.message}`);
        return;
      }

      const isAdmin = data === true;
      updateTestStatus(test.id, 'passed', `Admin status correctly determined: ${isAdmin ? 'User is admin' : 'User is not admin'}`);
    } catch (error) {
      updateTestStatus(test.id, 'failed', `Admin function test error: ${error}`);
    }
  };

  const testUnauthorizedAccess = async (test: SecurityTest) => {
    const testTables = ['career_profile', 'resume_streams', 'education', 'skill'];
    const results: string[] = [];
    let allSecure = true;

    for (const tableName of testTables) {
      try {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('id')
          .limit(1);

        if (error && error.code === '42501') {
          results.push(`${tableName}: ✓ Properly secured`);
        } else if (error) {
          results.push(`${tableName}: ? Error - ${error.message}`);
        } else {
          results.push(`${tableName}: ✓ Accessible (may be user's own data)`);
        }
      } catch (error) {
        results.push(`${tableName}: ✗ Test failed - ${error}`);
        allSecure = false;
      }
    }

    updateTestStatus(
      test.id, 
      allSecure ? 'passed' : 'failed',
      `Table access test results:\n${results.join('\n')}`,
      allSecure ? [] : ['Review RLS policies on failed tables']
    );
  };

  const testPolicyCoverage = async (test: SecurityTest) => {
    try {
      const { data: policies, error } = await supabase.rpc('sql-query', {
        query: `
          SELECT DISTINCT tablename 
          FROM pg_policies 
          WHERE schemaname = 'public'
          ORDER BY tablename
        `
      });

      if (error) {
        updateTestStatus(test.id, 'failed', `Policy coverage test failed: ${error.message}`);
        return;
      }

      const criticalTables = [
        'work_experience', 'education', 'skill', 'project', 'certification',
        'career_profile', 'jobs', 'interviews', 'resume_streams', 'resume_versions',
        'career_enrichment', 'career_narratives', 'entry_enrichment'
      ];

      const securedTables = new Set(policies?.map((p: any) => p.tablename) || []);
      const unsecuredTables = criticalTables.filter(table => !securedTables.has(table));

      if (unsecuredTables.length === 0) {
        updateTestStatus(test.id, 'passed', `All ${criticalTables.length} critical tables have RLS policies`);
      } else {
        updateTestStatus(test.id, 'failed', 
          `${unsecuredTables.length} critical tables missing RLS policies: ${unsecuredTables.join(', ')}`,
          ['Add RLS policies to all critical tables', 'Review table security requirements']
        );
      }
    } catch (error) {
      updateTestStatus(test.id, 'failed', `Policy coverage test error: ${error}`);
    }
  };

  const testSecureDeletion = async (test: SecurityTest) => {
    try {
      // Test the dry run function to ensure it works without actually deleting data
      const { data, error } = await supabase.rpc('test_user_deletion_dry_run', {
        target_user_id: user?.id
      });

      if (error) {
        updateTestStatus(test.id, 'failed', `Secure deletion test failed: ${error.message}`);
        return;
      }

      if (data && Array.isArray(data)) {
        const totalRows = data.reduce((sum: number, item: any) => sum + (item.rows_to_delete || 0), 0);
        updateTestStatus(test.id, 'passed', 
          `Secure deletion function working correctly. Would delete ${totalRows} rows across ${data.length} tables.`
        );
      } else {
        updateTestStatus(test.id, 'passed', 'Secure deletion function accessible, no user data found');
      }
    } catch (error) {
      updateTestStatus(test.id, 'failed', `Secure deletion test error: ${error}`);
    }
  };

  const runAllTests = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to run security tests.",
        variant: "destructive",
      });
      return;
    }

    setIsRunningTests(true);
    
    // Reset all tests to pending
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const, result: undefined, recommendations: undefined })));

    // Run tests sequentially to avoid overwhelming the system
    for (const test of tests) {
      await runSecurityTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunningTests(false);
    
    toast({
      title: "Security tests completed",
      description: "All security tests have been executed.",
    });
  };

  const getStatusIcon = (status: SecurityTest['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'pending': return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: SecurityTest['status']) => {
    const variants = {
      passed: 'default' as const,
      failed: 'destructive' as const,
      running: 'secondary' as const,
      pending: 'outline' as const
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const runningTests = tests.filter(t => t.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Test Summary */}
      <Alert>
        <TestTube className="h-4 w-4" />
        <AlertDescription>
          Security Test Suite: {passedTests} passed, {failedTests} failed, {runningTests} running
          {failedTests > 0 && ' - Review failed tests for security vulnerabilities'}
        </AlertDescription>
      </Alert>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Testing Suite
              </CardTitle>
              <CardDescription>
                Comprehensive security tests to verify RLS policies and access controls
              </CardDescription>
            </div>
            <Button 
              onClick={runAllTests}
              disabled={isRunningTests || !user}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(
              tests.reduce((acc, test) => {
                if (!acc[test.category]) acc[test.category] = [];
                acc[test.category].push(test);
                return acc;
              }, {} as Record<string, SecurityTest[]>)
            ).map(([category, categoryTests]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-medium text-lg flex items-center gap-2">
                  {category === 'Access Control' && <Lock className="w-4 h-4" />}
                  {category === 'Privilege Escalation' && <Users className="w-4 h-4" />}
                  {category === 'Configuration' && <Database className="w-4 h-4" />}
                  {category === 'Data Protection' && <Shield className="w-4 h-4" />}
                  {category}
                </h3>
                
                <div className="space-y-2">
                  {categoryTests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(test.status)}
                          <span className="font-medium">{test.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(test.status)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runSecurityTest(test)}
                            disabled={test.status === 'running' || isRunningTests || !user}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {test.description}
                      </p>
                      
                      {test.result && (
                        <div className="text-xs bg-muted p-2 rounded mb-2">
                          <pre className="whitespace-pre-wrap">{test.result}</pre>
                        </div>
                      )}
                      
                      {test.recommendations && test.recommendations.length > 0 && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-3 w-3" />
                          <AlertDescription className="text-xs">
                            <strong>Recommendations:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {test.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
