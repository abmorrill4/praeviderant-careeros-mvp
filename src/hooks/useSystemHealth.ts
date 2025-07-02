import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime: string;
  details?: string;
}

interface SystemHealth {
  healthChecks: HealthCheck[];
  overallStatus: 'healthy' | 'warning' | 'error';
  loading: boolean;
  error: string | null;
}

export const useSystemHealth = (refreshInterval = 30000) => {
  const [health, setHealth] = useState<SystemHealth>({
    healthChecks: [],
    overallStatus: 'healthy',
    loading: true,
    error: null,
  });

  const performHealthChecks = async (): Promise<HealthCheck[]> => {
    const checks: HealthCheck[] = [];
    
    // Database health check
    try {
      const start = Date.now();
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const responseTime = Date.now() - start;
      
      checks.push({
        name: 'Database',
        status: error ? 'error' : responseTime > 1000 ? 'warning' : 'healthy',
        responseTime: `${responseTime}ms`,
        details: error?.message
      });
    } catch (error) {
      checks.push({
        name: 'Database',
        status: 'error',
        responseTime: 'timeout',
        details: 'Connection failed'
      });
    }

    // Authentication check
    try {
      const start = Date.now();
      const { data } = await supabase.auth.getSession();
      const responseTime = Date.now() - start;
      
      checks.push({
        name: 'Authentication',
        status: responseTime > 500 ? 'warning' : 'healthy',
        responseTime: `${responseTime}ms`
      });
    } catch (error) {
      checks.push({
        name: 'Authentication',
        status: 'error',
        responseTime: 'timeout'
      });
    }

    // File Storage check
    try {
      const start = Date.now();
      const { data, error } = await supabase.storage.listBuckets();
      const responseTime = Date.now() - start;
      
      checks.push({
        name: 'File Storage',
        status: error ? 'error' : responseTime > 2000 ? 'warning' : 'healthy',
        responseTime: `${responseTime}ms`,
        details: error?.message
      });
    } catch (error) {
      checks.push({
        name: 'File Storage',
        status: 'error',
        responseTime: 'timeout'
      });
    }

    // Edge Functions check (basic connectivity)
    try {
      const start = Date.now();
      // Test edge function via SQL query function
      const { data, error } = await supabase.rpc('is_admin_user');
      const responseTime = Date.now() - start;
      
      checks.push({
        name: 'Edge Functions',
        status: error ? 'warning' : responseTime > 3000 ? 'warning' : 'healthy',
        responseTime: `${responseTime}ms`,
        details: error?.message
      });
    } catch (error) {
      checks.push({
        name: 'Edge Functions',
        status: 'error',
        responseTime: 'timeout'
      });
    }

    // Real-time check
    try {
      const start = Date.now();
      const channel = supabase.channel('health-check');
      
      // Test subscription
      const subscription = channel.subscribe((status) => {
        const responseTime = Date.now() - start;
        checks.push({
          name: 'Real-time',
          status: status === 'SUBSCRIBED' ? 'healthy' : 'warning',
          responseTime: `${responseTime}ms`
        });
      });

      // Cleanup after a short delay
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 1000);

    } catch (error) {
      checks.push({
        name: 'Real-time',
        status: 'error',
        responseTime: 'timeout'
      });
    }

    return checks;
  };

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setHealth(prev => ({ ...prev, loading: true, error: null }));

        const healthChecks = await performHealthChecks();
        
        // Determine overall status
        const hasError = healthChecks.some(check => check.status === 'error');
        const hasWarning = healthChecks.some(check => check.status === 'warning');
        
        const overallStatus = hasError ? 'error' : hasWarning ? 'warning' : 'healthy';

        setHealth({
          healthChecks,
          overallStatus,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error('Error performing health checks:', error);
        setHealth(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Health check failed'
        }));
      }
    };

    fetchHealth();
    
    // Set up refresh interval
    const interval = setInterval(fetchHealth, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return health;
};