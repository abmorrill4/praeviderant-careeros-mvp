
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityMonitoringPanel } from '@/components/debug/SecurityMonitoringPanel';
import { SecurityHardeningStatus } from '@/components/debug/SecurityHardeningStatus';
import { SecurityTestingSuite } from '@/components/debug/SecurityTestingSuite';
import { SchemaValidationPanel } from '@/components/debug/SchemaValidationPanel';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';

const SecurityDashboard: React.FC = () => {
  return (
    <DashboardPageLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive security monitoring and validation for CareerOS</p>
        </div>

        <Tabs defaultValue="monitoring" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monitoring">Security Monitoring</TabsTrigger>
            <TabsTrigger value="hardening">Hardening Status</TabsTrigger>
            <TabsTrigger value="testing">Security Testing</TabsTrigger>
            <TabsTrigger value="validation">Schema Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-6">
            <SecurityMonitoringPanel />
          </TabsContent>

          <TabsContent value="hardening" className="space-y-6">
            <SecurityHardeningStatus />
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <SecurityTestingSuite />
          </TabsContent>

          <TabsContent value="validation" className="space-y-6">
            <SchemaValidationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardPageLayout>
  );
};

export default SecurityDashboard;
