import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import { useOrg } from '@/hooks/use-org';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrgStatsResponse } from '@/types/salesforce-stats';

export function OrgGeneralStatsPage() {
  const { toast } = useToast();
  const { id } = useParams();
  const { selectedOrg } = useOrg();
  
  const orgId = id || selectedOrg?.id?.toString() || '';
  
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery<OrgStatsResponse>({
    queryKey: ['/api/orgs/stats/general', orgId],
    enabled: !!orgId,
    refetchOnWindowFocus: false
  });

  const refreshStats = () => {
    refetch();
    toast({
      title: 'Refreshing stats',
      description: 'Fetching the latest data from Salesforce'
    });
  };

  // Format the timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Org General Statistics"
        description="Key metrics and limits for your Salesforce organization"
        icon={<BarChart3 className="h-6 w-6" />}
        action={
          <Button 
            variant="outline" 
            onClick={refreshStats} 
            disabled={isLoading || isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-8">
          <div>
            <Skeleton className="h-8 w-36 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-8 w-36 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : isError ? (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <h3 className="font-semibold">Error loading statistics</h3>
          <p>{(error as Error)?.message || 'Failed to fetch organization statistics.'}</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : data?.stats?.length === 0 ? (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
          <h3 className="font-semibold">No statistics available</h3>
          <p>We couldn't find any statistics for this organization.</p>
        </div>
      ) : (
        <>
          <div className="mt-2 text-sm text-muted-foreground flex justify-end">
            Last updated: {data?.timestamp ? formatTimestamp(data.timestamp) : 'Unknown'}
          </div>
          <div className="mt-6">
            <KpiGrid stats={data?.stats || []} />
          </div>
        </>
      )}
    </div>
  );
}