import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, AlertCircle, Code, GitBranch, FileText, AlertTriangle, Shield } from 'lucide-react';
import CodeQualityOverview from '@/components/code-quality/code-quality-overview';
import DependencyGraph from '@/components/dependencies/dependency-graph';

// Placeholder for future compliance component
const ComplianceOverview = ({ orgId }: { orgId: number }) => (
  <div className="p-4 border rounded-md bg-muted/50">
    <div className="flex items-center space-x-2">
      <Shield className="h-6 w-6 text-primary" />
      <h3 className="text-lg font-medium">Compliance Overview</h3>
    </div>
    <p className="mt-2 text-muted-foreground">
      The compliance analysis feature is coming soon. This will provide insights into how your Salesforce org adheres to security best practices, governance policies, and industry standards.
    </p>
  </div>
);

// Placeholder for future technical debt component
const TechnicalDebtOverview = ({ orgId }: { orgId: number }) => (
  <div className="p-4 border rounded-md bg-muted/50">
    <div className="flex items-center space-x-2">
      <AlertTriangle className="h-6 w-6 text-primary" />
      <h3 className="text-lg font-medium">Technical Debt Overview</h3>
    </div>
    <p className="mt-2 text-muted-foreground">
      The technical debt tracking feature is coming soon. This will help you identify, track, and prioritize technical debt items across your Salesforce org.
    </p>
  </div>
);

const CodeAnalysisPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  
  // Get URL parameters
  const params = new URLSearchParams(location.split('?')[1]);
  const orgIdFromUrl = params.get('orgId');
  
  // Parse orgId from URL or use selected orgId
  const orgId = orgIdFromUrl ? parseInt(orgIdFromUrl) : selectedOrgId;
  
  // Fetch available orgs for the select dropdown
  const { data: orgs, isLoading: orgsLoading, error: orgsError } = useQuery({
    queryKey: ['/api/orgs'],
    queryFn: async () => {
      const response = await fetch('/api/orgs');
      if (!response.ok) {
        throw new Error('Failed to fetch orgs');
      }
      return response.json();
    },
  });
  
  const handleOrgChange = (value: string) => {
    const newOrgId = parseInt(value);
    setSelectedOrgId(newOrgId);
    
    // Update URL with the new orgId
    const newParams = new URLSearchParams(params);
    newParams.set('orgId', value);
    setLocation(`/code-analysis?${newParams.toString()}`);
  };
  
  if (orgsLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (orgsError) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load Salesforce orgs. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Code Analysis</h1>
          <p className="text-muted-foreground">
            Analyze code quality, dependencies, and technical health of your Salesforce org
          </p>
        </div>
        
        {orgs && orgs.length > 0 && (
          <div className="w-full md:w-auto">
            <Select 
              value={orgId?.toString() || ''} 
              onValueChange={handleOrgChange}
            >
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Select Salesforce org" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((org: any) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {!orgId && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No org selected</AlertTitle>
          <AlertDescription>
            Please select a Salesforce org to analyze from the dropdown above.
          </AlertDescription>
        </Alert>
      )}
      
      {orgId && (
        <Tabs defaultValue="quality" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto">
            <TabsTrigger value="quality" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span>Code Quality</span>
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <span>Dependencies</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="technical-debt" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Technical Debt</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="quality" className="mt-6">
            <CodeQualityOverview orgId={orgId} />
          </TabsContent>
          
          <TabsContent value="dependencies" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <DependencyGraph 
                  orgId={orgId} 
                  title="Component Dependency Map"
                  description="Interactive visualization of component relationships in your org"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="compliance" className="mt-6">
            <ComplianceOverview orgId={orgId} />
          </TabsContent>
          
          <TabsContent value="technical-debt" className="mt-6">
            <TechnicalDebtOverview orgId={orgId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CodeAnalysisPage;