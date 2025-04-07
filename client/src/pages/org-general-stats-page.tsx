import React, { useState, useEffect } from 'react';
import { useOrg } from '@/hooks/use-org';
import { KPIGrid } from '@/components/dashboard/kpi-grid';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { OrgStat, StatCategory, OrgStatsResponse } from '@/types/salesforce-stats';

export function OrgGeneralStatsPage() {
  const { currentOrg } = useOrg();
  const [stats, setStats] = useState<OrgStat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StatCategory | null>(null);
  
  // Function to fetch org general stats
  const fetchStats = async () => {
    if (!currentOrg) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/orgs/${currentOrg.id}/general-stats`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch organization statistics: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching org stats:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch stats when the component mounts or when the selected org changes
  useEffect(() => {
    if (currentOrg) {
      fetchStats();
    }
  }, [currentOrg]);
  
  // Handle category filter change
  const handleCategoryFilter = (category: StatCategory | null) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };
  
  // Render loading state
  if (loading && stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <RefreshCw className="animate-spin h-8 w-8 text-primary mb-4" />
        <p>Loading organization statistics...</p>
      </div>
    );
  }
  
  // Render error state
  if (error && !loading && stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-destructive">
        <p className="text-lg font-semibold mb-2">Error loading statistics</p>
        <p className="mb-4">{error}</p>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }
  
  // Render empty state
  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg font-semibold mb-2">No Organization Selected</p>
        <p className="text-muted-foreground">Please select a Salesforce organization to view its statistics.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {currentOrg.name} - Organization Health
        </h1>
        <Button 
          onClick={fetchStats} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryFilter(null)}
        >
          All
        </Button>
        <Button 
          variant={selectedCategory === 'api' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryFilter('api')}
        >
          API Usage
        </Button>
        <Button 
          variant={selectedCategory === 'storage' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryFilter('storage')}
        >
          Storage
        </Button>
        <Button 
          variant={selectedCategory === 'metadata' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryFilter('metadata')}
        >
          Metadata Components
        </Button>
        <Button 
          variant={selectedCategory === 'users' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryFilter('users')}
        >
          Users
        </Button>
        <Button 
          variant={selectedCategory === 'automation' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryFilter('automation')}
        >
          Automation
        </Button>
      </div>
      
      {stats.length > 0 ? (
        <KPIGrid 
          stats={stats} 
          filterByCategory={selectedCategory || undefined} 
        />
      ) : (
        <div className="bg-card border rounded-lg p-6 text-center">
          <p className="text-muted-foreground">
            No statistics available for this organization.
          </p>
        </div>
      )}
    </div>
  );
}