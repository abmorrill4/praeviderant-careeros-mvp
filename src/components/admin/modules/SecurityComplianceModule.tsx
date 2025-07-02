import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  FileText,
  Lock,
  Activity
} from 'lucide-react';
import { SecurityMonitoringPanel } from '@/components/debug/SecurityMonitoringPanel';
import { SecurityTestingSuite } from '@/components/debug/SecurityTestingSuite';
import { SecurityHardeningStatus } from '@/components/debug/SecurityHardeningStatus';
import { SchemaValidationPanel } from '@/components/debug/SchemaValidationPanel';

export const SecurityComplianceModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock security metrics - replace with real data
  const securityMetrics = {
    securityScore: 92,
    activeThreat: 0,
    blockedAttempts: 15,
    lastAudit: '2 hours ago',
    compliance: 98.5
  };

  const securityAlerts = [
    { 
      id: 1, 
      type: 'info', 
      message: 'Security scan completed successfully', 
      time: '10 minutes ago' 
    },
    { 
      id: 2, 
      type: 'warning', 
      message: 'Unusual login pattern detected for user@example.com', 
      time: '2 hours ago' 
    },
    { 
      id: 3, 
      type: 'success', 
      message: 'All security tests passed', 
      time: '6 hours ago' 
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Security & Compliance</h1>
        <p className="text-muted-foreground">
          Monitor security status, run tests, and ensure compliance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="testing">Security Testing</TabsTrigger>
          <TabsTrigger value="hardening">Hardening Status</TabsTrigger>
          <TabsTrigger value="validation">Schema Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(securityMetrics.securityScore)}`}>
                  {securityMetrics.securityScore}%
                </div>
                <p className="text-xs text-muted-foreground">Overall security rating</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{securityMetrics.activeThreat}</div>
                <p className="text-xs text-muted-foreground">No active threats</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blocked Today</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.blockedAttempts}</div>
                <p className="text-xs text-muted-foreground">Suspicious attempts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{securityMetrics.compliance}%</div>
                <p className="text-xs text-muted-foreground">Standards compliance</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Security Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recent Security Alerts
              </CardTitle>
              <CardDescription>
                Latest security events and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Security Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Security Actions</CardTitle>
              <CardDescription>
                Common security administration tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <Eye className="w-6 h-6 mb-2" />
                  <h4 className="font-medium">Review Audit Logs</h4>
                  <p className="text-sm text-muted-foreground">Check recent system activity</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <Shield className="w-6 h-6 mb-2" />
                  <h4 className="font-medium">Run Security Scan</h4>
                  <p className="text-sm text-muted-foreground">Perform vulnerability assessment</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <FileText className="w-6 h-6 mb-2" />
                  <h4 className="font-medium">Generate Report</h4>
                  <p className="text-sm text-muted-foreground">Export security summary</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <SecurityMonitoringPanel />
        </TabsContent>

        <TabsContent value="testing">
          <SecurityTestingSuite />
        </TabsContent>

        <TabsContent value="hardening">
          <SecurityHardeningStatus />
        </TabsContent>

        <TabsContent value="validation">
          <SchemaValidationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};