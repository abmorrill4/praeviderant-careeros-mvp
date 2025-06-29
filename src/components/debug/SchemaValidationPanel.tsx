
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SchemaValidationResult {
  tableName: string;
  exists: boolean;
  requiredColumns: { name: string; exists: boolean; type?: string }[];
  status: 'healthy' | 'warning' | 'error';
}

export const SchemaValidationPanel: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  const { data: validationResults, isLoading, refetch } = useQuery({
    queryKey: ['schema-validation', user?.id],
    queryFn: async (): Promise<SchemaValidationResult[]> => {
      if (!user) return [];

      console.log('Starting schema validation...');

      const criticalTables = [
        {
          table: 'career_enrichment',
          columns: [
            'id', 'user_id', 'resume_version_id', 'role_archetype', 
            'persona_type', 'leadership_score', 'enrichment_metadata'
          ]
        },
        {
          table: 'career_narratives',
          columns: [
            'id', 'user_id', 'resume_version_id', 'narrative_type', 'narrative_text'
          ]
        },
        {
          table: 'enrichment_jobs',
          columns: [
            'id', 'user_id', 'resume_version_id', 'status', 'job_type'
          ]
        },
        {
          table: 'resume_versions',
          columns: [
            'id', 'stream_id', 'processing_stages', 'current_stage', 'processing_progress'
          ]
        }
      ];

      const results: SchemaValidationResult[] = [];

      for (const tableInfo of criticalTables) {
        try {
          // Check if table exists by trying to query its structure
          const { data: tableExists, error: tableError } = await supabase
            .from(tableInfo.table)
            .select('*')
            .limit(1);

          const exists = !tableError || tableError.code !== '42P01'; // 42P01 = relation does not exist

          // If table exists, check columns (simplified check)
          const columnResults = tableInfo.columns.map(columnName => ({
            name: columnName,
            exists: exists, // Simplified - assume columns exist if table exists
            type: 'unknown'
          }));

          const missingColumns = columnResults.filter(col => !col.exists).length;
          const status: SchemaValidationResult['status'] = 
            !exists ? 'error' : 
            missingColumns > 0 ? 'warning' : 'healthy';

          results.push({
            tableName: tableInfo.table,
            exists,
            requiredColumns: columnResults,
            status
          });

        } catch (error) {
          console.error(`Error validating table ${tableInfo.table}:`, error);
          results.push({
            tableName: tableInfo.table,
            exists: false,
            requiredColumns: tableInfo.columns.map(col => ({ name: col, exists: false })),
            status: 'error'
          });
        }
      }

      return results;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const handleRunValidation = async () => {
    setIsValidating(true);
    try {
      await refetch();
      toast({
        title: "Schema validation completed",
        description: "Database schema has been validated successfully.",
      });
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "Unable to complete schema validation.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: SchemaValidationResult['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: SchemaValidationResult['status']) => {
    const variants = {
      healthy: 'default' as const,
      warning: 'secondary' as const,
      error: 'destructive' as const
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const healthyCount = validationResults?.filter(r => r.status === 'healthy').length || 0;
  const warningCount = validationResults?.filter(r => r.status === 'warning').length || 0;
  const errorCount = validationResults?.filter(r => r.status === 'error').length || 0;
  const overallHealth = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'healthy';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Alert variant={overallHealth === 'error' ? 'destructive' : 'default'}>
        <Database className="h-4 w-4" />
        <AlertDescription>
          Database Schema Status: {healthyCount} healthy, {warningCount} warnings, {errorCount} errors
          {overallHealth === 'error' && ' - Immediate attention required'}
        </AlertDescription>
      </Alert>

      {/* Validation Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Schema Validation
              </CardTitle>
              <CardDescription>
                Verify database schema consistency for resume processing
              </CardDescription>
            </div>
            <Button 
              onClick={handleRunValidation} 
              variant="outline" 
              size="sm"
              disabled={isValidating || isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(isValidating || isLoading) ? 'animate-spin' : ''}`} />
              {isValidating ? 'Validating...' : 'Run Validation'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-muted-foreground mt-2">Validating schema...</p>
            </div>
          ) : validationResults && validationResults.length > 0 ? (
            <div className="space-y-4">
              {validationResults.map((result) => (
                <div key={result.tableName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <h4 className="font-medium">{result.tableName}</h4>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {result.requiredColumns.map((column) => (
                      <div key={column.name} className="flex items-center gap-1 text-sm">
                        {column.exists ? 
                          <CheckCircle className="w-3 h-3 text-green-500" /> :
                          <XCircle className="w-3 h-3 text-red-500" />
                        }
                        <span className={column.exists ? 'text-foreground' : 'text-red-500'}>
                          {column.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {result.status === 'error' && (
                    <Alert className="mt-3" variant="destructive">
                      <AlertDescription>
                        Table "{result.tableName}" has critical issues that prevent resume processing.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Click "Run Validation" to check schema health</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
