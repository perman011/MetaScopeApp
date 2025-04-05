import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import ConnectSalesforceOrgDialog from '@/components/connect-salesforce-org-dialog';
import { useOrgContext } from '@/hooks/use-org';
import ApiUsage from '@/components/dashboard/api-usage';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertTriangle, Database } from 'lucide-react';

// Define the API Usage data interface
interface ApiUsageData {
  dailyApiRequests: {
    used: number;
    total: number;
  };
  concurrentApiRequests: {
    used: number;
    total: number;
  };
  requestsByType: {
    type: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  requestsByMethod: {
    method: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  topConsumers: {
    name: string;
    requests: number;
    percentage: number;
  }[];
  errorRates: {
    type: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  usageTrend: {
    date: string;
    requests: number;
    limit: number;
  }[];
  responseTime: {
    average: number;
    percentile95: number;
    percentile99: number;
  };
  batchEfficiency: {
    batchOperations: number;
    singleOperations: number;
    potentialBatchSavings: number;
  };
  rateLimitEvents: {
    date: string;
    count: number;
    duration: number;
  }[];
  optimizationRecommendations: {
    id: string;
    title: string;
    description: string;
    impact: string;
    type: string;
  }[];
}

// Mock data for development
const mockApiUsageData: ApiUsageData = {
  // Daily limits
  dailyApiRequests: {
    used: 14782,
    total: 25000,
  },
  
  // Per-user API requests
  concurrentApiRequests: {
    used: 8,
    total: 25,
  },
  
  // API request types
  requestsByType: [
    { type: 'REST', count: 8765, percentage: 59, color: '#3B82F6' },
    { type: 'SOAP', count: 3546, percentage: 24, color: '#10B981' },
    { type: 'Bulk', count: 1890, percentage: 13, color: '#F59E0B' },
    { type: 'Metadata', count: 581, percentage: 4, color: '#8B5CF6' },
  ],
  
  // API request methods
  requestsByMethod: [
    { method: 'GET', count: 7842, percentage: 53, color: '#3B82F6' },
    { method: 'POST', count: 4291, percentage: 29, color: '#10B981' },
    { method: 'PATCH', count: 1654, percentage: 11, color: '#F59E0B' },
    { method: 'DELETE', count: 581, percentage: 4, color: '#EC4899' },
    { method: 'HEAD', count: 414, percentage: 3, color: '#6B7280' },
  ],
  
  // Top API consumers (users/integrations)
  topConsumers: [
    { name: 'Data Integration Service', requests: 5432, percentage: 37 },
    { name: 'Admin User', requests: 3789, percentage: 26 },
    { name: 'Marketing Automation', requests: 2143, percentage: 14 },
    { name: 'Sales Dashboard', requests: 1987, percentage: 13 },
    { name: 'Customer Portal', requests: 1431, percentage: 10 },
  ],
  
  // Error rates
  errorRates: [
    { type: 'Rate Limit', count: 187, percentage: 1.3, color: '#EF4444' },
    { type: 'Authentication', count: 94, percentage: 0.6, color: '#F59E0B' },
    { type: 'Validation', count: 213, percentage: 1.4, color: '#3B82F6' },
    { type: 'Server', count: 32, percentage: 0.2, color: '#8B5CF6' },
  ],
  
  // API usage over time (7 days)
  usageTrend: [
    { date: '2025-03-29', requests: 15243, limit: 25000 },
    { date: '2025-03-30', requests: 13587, limit: 25000 },
    { date: '2025-03-31', requests: 16421, limit: 25000 },
    { date: '2025-04-01', requests: 18743, limit: 25000 },
    { date: '2025-04-02', requests: 14852, limit: 25000 },
    { date: '2025-04-03', requests: 12754, limit: 25000 },
    { date: '2025-04-04', requests: 14782, limit: 25000 },
  ],
  
  // Response time metrics
  responseTime: {
    average: 458,
    percentile95: 1245,
    percentile99: 2378,
  },
  
  // Batch vs. single record operations
  batchEfficiency: {
    batchOperations: 3245,
    singleOperations: 7854,
    potentialBatchSavings: 4538,
  },
  
  // Rate limiting events
  rateLimitEvents: [
    { date: '2025-04-01 14:32:18', count: 87, duration: 5 },
    { date: '2025-04-03 09:18:45', count: 42, duration: 3 },
    { date: '2025-04-04 17:52:31', count: 58, duration: 4 },
  ],
  
  // Optimization recommendations
  optimizationRecommendations: [
    {
      id: 'opt-001',
      title: 'Implement Composite API Requests',
      description: 'Consolidate multiple related API calls into single composite requests to reduce the total number of API calls.',
      impact: 'high',
      type: 'limit',
    },
    {
      id: 'opt-002',
      title: 'Add API Response Caching',
      description: 'Implement client-side caching for frequently accessed data that doesn\'t change often.',
      impact: 'medium',
      type: 'performance',
    },
    {
      id: 'opt-003',
      title: 'Optimize SOQL Queries',
      description: 'Use selective queries and avoid retrieving unnecessary fields to improve response times and reduce resource usage.',
      impact: 'medium',
      type: 'efficiency',
    },
    {
      id: 'opt-004',
      title: 'Batch Similar Operations',
      description: 'Convert multiple single-record operations to batch operations when working with multiple records.',
      impact: 'high',
      type: 'limit',
    },
    {
      id: 'opt-005',
      title: 'Implement Exponential Backoff',
      description: 'Add intelligent retry logic with exponential backoff to handle rate limiting gracefully.',
      impact: 'medium',
      type: 'limit',
    },
  ],
};

export default function ApiUsagePage() {
  const [openConnectDialog, setOpenConnectDialog] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [useTimeoutMockData, setUseTimeoutMockData] = useState(false);
  const { activeOrg } = useOrgContext();
  
  // Fetch API usage data
  const { data: apiUsageData, isLoading: isApiUsageLoading, refetch, error } = useQuery<ApiUsageData>({
    queryKey: activeOrg ? ['/api/orgs', activeOrg.id, 'api-usage'] : [],
    enabled: !!activeOrg,
    retry: 2,
    retryDelay: 1000, 
  });
  
  // Set a timeout to fall back to mock data if the API request takes too long
  React.useEffect(() => {
    // Only run the timeout when we're actively loading and have an org
    if (isApiUsageLoading && activeOrg && !useMockData) {
      console.log("Starting timeout for API usage data fetch");
      const timeoutId = setTimeout(() => {
        console.log("API usage data fetch timeout triggered, using mock data");
        setUseTimeoutMockData(true);
        toast({
          title: "Using demo data",
          description: "The API request is taking longer than expected. Showing sample data for now.",
          variant: "default",
        });
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [isApiUsageLoading, activeOrg, useMockData]);
  
  // Log any API errors for debugging
  React.useEffect(() => {
    if (error) {
      console.error("Error fetching API usage data:", error);
      toast({
        title: "API data fetch error",
        description: "Error fetching API usage data. Showing demo data instead.",
        variant: "destructive",
      });
      setUseTimeoutMockData(true);
    }
  }, [error]);
  
  // Handle action button clicks
  const handleActionClick = (actionId: string) => {
    // Implementation would call specific API endpoints for the action
    console.log(`Executing action: ${actionId}`);
    
    // Show toast notification
    toast({
      title: "Action triggered",
      description: `Action ${actionId} has been initiated`,
      variant: "default",
    });
  };
  
  // Handle refresh button
  const handleRefresh = () => {
    toast({
      title: "Refreshing data",
      description: "Fetching the latest API usage information",
    });
    refetch();
  };
  
  if (!activeOrg && !useMockData) {
    return (
      <div className="p-6 text-center space-y-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-blue-500" />
            </div>
            
            <h3 className="text-xl font-medium mb-2">API Usage Analytics</h3>
            <p className="text-neutral-500 mb-6">
              Connect a Salesforce org to analyze API usage patterns and optimize your integrations.
            </p>
            <div className="flex space-x-4 justify-center">
              <Button onClick={() => setOpenConnectDialog(true)}>
                Connect Salesforce Org
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setUseMockData(true)}
              >
                View Demo Data
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
      </div>
    );
  }
  
  // Make sure we explicitly use the mock data if useMockData is true or timeout triggered
  const dataToUse = useMockData || useTimeoutMockData ? mockApiUsageData : apiUsageData;
  
  // If we're still loading, show a loading indicator with an option to view demo data
  if (isApiUsageLoading && !useMockData && !useTimeoutMockData) {
    return (
      <div className="p-4 space-y-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="p-8 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-xl font-medium mb-2">Loading API Usage Data</h3>
            <p className="text-neutral-500 mb-6">
              This may take a few moments. If it continues to load, you can view sample data instead.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setUseMockData(true)}
              className="mx-auto"
            >
              View Demo Data Instead
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-6">
      <div className="w-full max-w-7xl mx-auto">
        {(useTimeoutMockData || useMockData) && (
          <div className="mb-4 w-full">
            <div className="bg-amber-50 border border-amber-300 text-amber-800 p-4 rounded-md mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Using demo data</h3>
                  <p className="text-sm mt-1">
                    Showing sample API usage data. 
                    {useTimeoutMockData && (
                      <>
                        Failed to fetch real-time data.
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-2" 
                          onClick={() => {
                            setUseTimeoutMockData(false);
                            refetch();
                          }}
                        >
                          Try Again
                        </Button>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <ApiUsage 
          orgId={activeOrg?.id || 0}
          apiUsageData={dataToUse || mockApiUsageData} 
          isLoading={false} // Set to false because we'll show our own loading UI above
          onRefresh={handleRefresh}
          onActionClick={handleActionClick}
        />
      </div>
    </div>
  );
}