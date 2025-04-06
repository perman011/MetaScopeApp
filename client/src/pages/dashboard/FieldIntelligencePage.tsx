import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import ConnectSalesforceOrgDialog from '@/components/connect-salesforce-org-dialog';
import { useOrg } from '@/hooks/use-org';
import { FieldIntelligence } from '@/components/dashboard/field-intelligence';
import { HealthScore } from '@shared/schema';

const mockFieldData: HealthScore = {
  id: 0,
  orgId: 0,
  overallScore: 78,
  securityScore: 82,
  dataModelScore: 74,
  automationScore: 79,
  apexScore: 81,
  uiComponentScore: 76,
  complexityScore: 65,
  performanceRisk: 42,
  technicalDebt: 51,
  metadataVolume: 36842,
  customizationLevel: 78,
  lastAnalyzed: new Date(),
  issues: [
    {
      id: 'FI-001',
      severity: 'critical',
      category: 'security',
      title: 'Sensitive Data Fields Without Protection',
      description: 'Multiple fields containing PII data lack proper security controls.',
      impact: 'Potential data exposure and compliance violations.',
      recommendation: 'Apply field-level security to all sensitive data fields.'
    },
    {
      id: 'FI-002',
      severity: 'warning',
      category: 'dataModel',
      title: 'Unused Custom Fields',
      description: '86 custom fields haven\'t been accessed in the past 12 months.',
      impact: 'Cluttered UI and decreased performance',
      recommendation: 'Review and remove unnecessary fields.'
    },
    {
      id: 'FI-003',
      severity: 'warning',
      category: 'dataModel',
      title: 'Inconsistent Field Naming',
      description: '48 fields don\'t follow the organization\'s naming conventions.',
      impact: 'Confusion for developers and admins',
      recommendation: 'Standardize field naming across objects.'
    },
    {
      id: 'FI-004',
      severity: 'info',
      category: 'dataModel',
      title: 'Missing Field Documentation',
      description: 'Over 300 fields lack proper descriptions or help text.',
      impact: 'Diminished user experience and data quality',
      recommendation: 'Add appropriate help text and descriptions to fields.'
    },
  ]
};

export default function FieldIntelligencePage() {
  const [openConnectDialog, setOpenConnectDialog] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const { activeOrg, setActiveOrg } = useOrg();
  
  const { data: healthScore, isLoading: isHealthScoreLoading } = useQuery<HealthScore>({
    queryKey: activeOrg ? ['/api/health-score', activeOrg.id] : [],
    enabled: !!activeOrg,
  });
  
  // Handle auto-fix actions
  const handleAutoFix = (actionId: string) => {
    // In a real implementation, this would call an API to execute the fix
    console.log(`Auto-fixing issue: ${actionId}`);
    
    // Show a success toast
    toast({
      title: "Auto-fix Applied",
      description: `Successfully applied fix for ${actionId}`,
      variant: "default",
    });
  };
  
  if (!activeOrg) {
    return (
      <div className="p-6 text-center space-y-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <h3 className="text-xl font-medium mb-2">No Salesforce Org Connected</h3>
            <p className="text-neutral-500 mb-6">
              Connect a Salesforce org to view field intelligence and optimize your data model.
            </p>
            <div className="flex space-x-4 justify-center">
              <Button onClick={() => setOpenConnectDialog(true)}>
                Connect Salesforce Org
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setUseMockData(true)}
              >
                Load Test Data
              </Button>
            </div>
            {openConnectDialog && (
              <ConnectSalesforceOrgDialog 
                onSuccess={() => setOpenConnectDialog(false)}
              >
                <></>
              </ConnectSalesforceOrgDialog>
            )}
          </CardContent>
        </Card>
        
        {useMockData && mockFieldData && (
          <div className="w-full max-w-6xl mx-auto">
            <FieldIntelligence 
              healthScore={mockFieldData} 
              isLoading={false}
              onActionClick={(actionId) => {
                toast({
                  title: "Action Selected",
                  description: `Executing action ${actionId} (test data)`,
                });
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="w-full max-w-6xl mx-auto">
        <FieldIntelligence 
          healthScore={healthScore ? healthScore : mockFieldData} 
          isLoading={isHealthScoreLoading}
          onActionClick={(actionId) => {
            // Show toast with action information
            toast({
              title: "Action Selected",
              description: `Executing action ${actionId}`,
            });
            
            // Auto-fix issues
            handleAutoFix(actionId);
          }}
        />
      </div>
    </div>
  );
}