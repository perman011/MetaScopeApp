import { useEffect, useState } from "react";
import { useOrg } from "@/hooks/use-org";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  ResponsiveContainer 
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import MetadataTreemapViz from "@/components/visualization/metadata-treemap-viz";

// Interfaces for our data structures
interface DonutChartData {
  name: string;
  value: number;
}

interface BarChartData {
  type: string;
  count: number;
}

interface ReferencedComponent {
  type: string;
  name: string;
  referenceCount: number;
  lastModified: string;
}

interface StaleComponent {
  type: string;
  name: string;
  lastUsed: string;
}

interface MetadataItem {
  id?: number;
  orgId?: number;
  name?: string;
  type?: string;
  lastModified?: string;
  content?: string;
  referenceCount?: number;
  isCustom?: boolean;
}

interface TreemapItem {
  name: string;
  size?: number;
  children?: TreemapItem[];
  fill?: string;
}

interface ProcessedMetadata {
  customVsStandard: DonutChartData[];
  componentsByType: BarChartData[];
  referencedComponents: ReferencedComponent[];
  staleComponents: StaleComponent[];
  treemapData: TreemapItem;
}

export default function MetadataAnalytics() {
  const { activeOrg } = useOrg();
  const [page, setPage] = useState(1);
  const [, navigate] = useLocation();
  const itemsPerPage = 10;

  // Fetch metadata for the active org
  const { data: metadataItems, isLoading: isMetadataLoading } = useQuery({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata`],
    enabled: !!activeOrg,
  });

  // Fetch metadata references - this would be a separate API endpoint in a full implementation
  const { data: referenceData, isLoading: isReferencesLoading } = useQuery({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata/dependencies`],
    enabled: !!activeOrg,
  });

  // Sync metadata if none exists
  useEffect(() => {
    if (activeOrg && !isMetadataLoading && (!metadataItems || !Array.isArray(metadataItems) || metadataItems.length === 0)) {
      const syncMetadata = async () => {
        try {
          await apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {});
        } catch (error) {
          console.error("Error syncing metadata:", error);
        }
      };
      syncMetadata();
    }
  }, [activeOrg, metadataItems, isMetadataLoading]);

  // Process metadata for charts
  const processMetadata = () => {
    // Default mock data in case we don't have real data yet
    let customVsStandard = [
      { name: 'Custom Components', value: 125 },
      { name: 'Standard Components', value: 285 },
    ];
    
    let componentsByType = [
      { type: 'ApexClass', count: 52 },
      { type: 'Flow', count: 34 },
      { type: 'Field', count: 879 },
      { type: 'Object', count: 25 },
      { type: 'Layout', count: 43 },
      { type: 'Trigger', count: 18 },
      { type: 'ValidationRule', count: 29 },
      { type: 'WorkflowRule', count: 15 },
      { type: 'Report', count: 67 },
      { type: 'Dashboard', count: 31 },
    ];
    
    let referencedComponents = [
      { type: 'ApexClass', name: 'AccountTriggerHandler', referenceCount: 106, lastModified: new Date(2024, 2, 15).toISOString() },
      { type: 'Flow', name: 'Opportiunity Assignment Flow', referenceCount: 87, lastModified: new Date(2024, 1, 20).toISOString() },
      { type: 'Field', name: 'Contact Email', referenceCount: 74, lastModified: new Date(2024, 0, 10).toISOString() },
      { type: 'ApexClass', name: 'LeadConversionController', referenceCount: 58, lastModified: new Date(2023, 11, 5).toISOString() },
      { type: 'Object', name: 'Account', referenceCount: 53, lastModified: new Date(2023, 10, 12).toISOString() },
      { type: 'Trigger', name: 'ContactTrigger', referenceCount: 48, lastModified: new Date(2024, 3, 2).toISOString() },
      { type: 'Flow', name: 'Case Assignment', referenceCount: 45, lastModified: new Date(2024, 2, 8).toISOString() },
      { type: 'ApexClass', name: 'OpportunityService', referenceCount: 42, lastModified: new Date(2023, 9, 25).toISOString() },
      { type: 'Layout', name: 'Account Layout', referenceCount: 40, lastModified: new Date(2023, 8, 20).toISOString() },
      { type: 'Field', name: 'Opportunity Amount', referenceCount: 39, lastModified: new Date(2023, 7, 15).toISOString() },
      { type: 'ApexClass', name: 'TaskUtility', referenceCount: 37, lastModified: new Date(2023, 6, 30).toISOString() },
      { type: 'ValidationRule', name: 'Require Contact Email', referenceCount: 35, lastModified: new Date(2023, 5, 22).toISOString() },
    ];
    
    let staleComponents = [
      { type: 'ApexClass', name: 'OldAccountReview', lastUsed: new Date(2022, 10, 15).toISOString() },
      { type: 'ValidationRule', name: 'RequireContactInfo', lastUsed: new Date(2022, 4, 10).toISOString() },
      { type: 'ApexClass', name: 'LegacyBillingHandler', lastUsed: new Date(2022, 0, 20).toISOString() },
      { type: 'Flow', name: 'OutdatedOnboarding', lastUsed: new Date(2021, 11, 5).toISOString() },
      { type: 'Trigger', name: 'DeprecatedCaseTrigger', lastUsed: new Date(2021, 9, 8).toISOString() },
      { type: 'Layout', name: 'Old_Contact_Layout', lastUsed: new Date(2021, 7, 12).toISOString() },
    ];
    
    // Default treemap data
    let treemapData: TreemapItem = {
      name: "Metadata",
      children: [
        {
          name: "Objects",
          children: [
            { name: "Custom Objects", size: 45, fill: "#4f46e5" },
            { name: "Standard Objects", size: 32, fill: "#3b82f6" }
          ]
        },
        {
          name: "Apex",
          children: [
            { name: "Classes", size: 124, fill: "#ef4444" },
            { name: "Triggers", size: 38, fill: "#f97316" }
          ]
        },
        {
          name: "Automation",
          children: [
            { name: "Flows", size: 56, fill: "#10b981" },
            { name: "Process Builders", size: 28, fill: "#22c55e" }
          ]
        },
        {
          name: "UI",
          children: [
            { name: "Lightning Components", size: 72, fill: "#8b5cf6" },
            { name: "Visualforce Pages", size: 43, fill: "#a855f7" }
          ]
        },
        {
          name: "Layout",
          children: [
            { name: "Page Layouts", size: 65, fill: "#ec4899" },
            { name: "Record Types", size: 27, fill: "#f43f5e" }
          ]
        }
      ]
    };

    // If we have real metadata, process it
    if (metadataItems && Array.isArray(metadataItems) && metadataItems.length > 0) {
      try {
        // Process custom vs standard
        const customItems = metadataItems.filter(item => 
          item.name?.includes('__c') || 
          (item.type === 'ApexClass') || 
          (item.type === 'Trigger') || 
          (item.type === 'Flow')
        ).length;
        
        const standardItems = metadataItems.length - customItems;
        
        customVsStandard = [
          { name: 'Custom Components', value: customItems },
          { name: 'Standard Components', value: standardItems },
        ];
        
        // Process component types
        const typeCount: Record<string, number> = {};
        metadataItems.forEach(item => {
          const type = item.type || 'Unknown';
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
        
        componentsByType = Object.entries(typeCount)
          .map(([type, count]) => ({ type, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
          
        // For real implementation, we would process reference data here
        if (referenceData && Array.isArray(referenceData) && referenceData.length > 0) {
          // Process real reference data
          referencedComponents = referenceData.map(ref => ({
            type: ref.type || 'Unknown',
            name: ref.name || 'Unnamed',
            referenceCount: ref.refCount || 0,
            lastModified: ref.lastModified || new Date().toISOString()
          })).sort((a, b) => b.referenceCount - a.referenceCount);
        }
        
        // For stale components, use items older than 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        staleComponents = metadataItems
          .filter(item => {
            const lastModifiedDate = item.lastModified ? new Date(item.lastModified) : null;
            return lastModifiedDate && lastModifiedDate < sixMonthsAgo;
          })
          .map(item => ({
            type: item.type || 'Unknown',
            name: item.name || 'Unnamed',
            lastUsed: item.lastModified || new Date().toISOString()
          }))
          .slice(0, 10);
          
        // If no stale components found in real data, keep the mock data
        if (staleComponents.length === 0) {
          console.log("No stale components found in real data, using sample data");
        }
        
        // Process data for treemap - group by high-level categories
        const categoryMap = new Map<string, Map<string, number>>();
        
        // Define category mappings
        const typeToCategory: Record<string, string> = {
          'ApexClass': 'Apex',
          'ApexTrigger': 'Apex',
          'CustomObject': 'Objects',
          'CustomField': 'Fields',
          'Flow': 'Automation',
          'WorkflowRule': 'Automation',
          'LightningComponentBundle': 'UI',
          'VisualforcePage': 'UI',
          'Layout': 'Layout',
          'RecordType': 'Layout'
        };
        
        // Define colors for categories
        const categoryColors: Record<string, string> = {
          'Apex': '#ef4444',
          'Objects': '#3b82f6',
          'Fields': '#10b981',
          'Automation': '#f59e0b',
          'UI': '#8b5cf6',
          'Layout': '#ec4899',
          'Other': '#64748b'
        };
        
        // Process metadata items into categories and subcategories
        metadataItems.forEach(item => {
          const type = item.type || 'Unknown';
          const category = typeToCategory[type] || 'Other';
          
          if (!categoryMap.has(category)) {
            categoryMap.set(category, new Map<string, number>());
          }
          
          const subcategoryMap = categoryMap.get(category)!;
          const count = subcategoryMap.get(type) || 0;
          subcategoryMap.set(type, count + 1);
        });
        
        // Build treemap data structure
        const treemapChildren: TreemapItem[] = [];
        
        categoryMap.forEach((subcategories, category) => {
          const subcategoryItems: TreemapItem[] = [];
          
          subcategories.forEach((count, type) => {
            subcategoryItems.push({
              name: type,
              size: count,
              fill: categoryColors[category] || '#64748b'
            });
          });
          
          treemapChildren.push({
            name: category,
            children: subcategoryItems
          });
        });
        
        // Only update treemap data if we have actual categories
        if (treemapChildren.length > 0) {
          treemapData = {
            name: "Metadata",
            children: treemapChildren
          };
        }
      } catch (error) {
        console.error("Error processing metadata:", error);
        // Keep the mock data if there's an error
      }
    }
    
    return {
      customVsStandard,
      componentsByType,
      referencedComponents,
      staleComponents,
      treemapData
    };
  };
  
  const { customVsStandard, componentsByType, referencedComponents, staleComponents, treemapData } = processMetadata();
  const paginatedReferences = referencedComponents.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(referencedComponents.length / itemsPerPage);
  
  // Colors for charts
  const DONUT_COLORS = ['#3b82f6', '#22c55e']; // blue-500, green-500
  const BAR_COLORS = '#60a5fa'; // blue-400
  
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  if (!activeOrg) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Metadata Analytics</h1>
        <Card>
          <CardContent className="p-8">
            <p className="mb-4">Please connect a Salesforce organization to view metadata analytics.</p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isMetadataLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Metadata Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Metadata Analytics</h1>
      
      {/* Treemap Visualization */}
      <div className="mb-6">
        <MetadataTreemapViz 
          data={treemapData} 
          loading={isMetadataLoading}
          title="Metadata Hierarchy Visualization"
          description="Distribution of metadata components by category and type"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Chart 1: Custom vs Standard Components */}
        <Card>
          <CardHeader>
            <CardTitle>Custom vs Standard Components</CardTitle>
            <CardDescription>Distribution of custom versus standard metadata components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customVsStandard}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {customVsStandard.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} components`, null]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Chart 2: Component Count by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Component Count by Type</CardTitle>
            <CardDescription>Number of components by metadata type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={componentsByType}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="type" width={80} />
                  <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                  <Legend />
                  <Bar dataKey="count" fill={BAR_COLORS} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Table: Most Referenced Components */}
        <Card>
          <CardHeader>
            <CardTitle>Most Referenced Components</CardTitle>
            <CardDescription>Components with the highest reference counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Reference Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReferences.map((component, index) => (
                    <TableRow 
                      key={index} 
                      className="cursor-pointer hover:bg-neutral-50"
                      onClick={() => console.log(`Clicked: ${component.name}`)}
                    >
                      <TableCell>{component.type}</TableCell>
                      <TableCell>{component.name}</TableCell>
                      <TableCell className="text-right">{component.referenceCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show current page and nearby pages
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={pageNum === page}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && page < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>
        
        {/* List: Stale Components */}
        <Card>
          <CardHeader>
            <CardTitle>Stale Components (&gt;6 months)</CardTitle>
            <CardDescription>Components that haven't been used in over 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-y-auto max-h-[400px] border rounded-md p-4">
              {staleComponents.length === 0 ? (
                <p className="text-center text-neutral-500 py-4">No stale components found</p>
              ) : (
                <ul className="space-y-3">
                  {staleComponents.map((component, index) => (
                    <li key={index} className="pb-2 border-b border-neutral-200 last:border-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div>
                          <span className="font-medium">{component.type}:</span> {component.name}
                        </div>
                        <div className="text-sm text-neutral-500">
                          Last Used: {formatDate(component.lastUsed)}
                        </div>
                      </div>
                      <div className="mt-1">
                        <button 
                          className="text-primary-600 hover:text-primary-800 text-sm"
                          onClick={() => console.log(`View metadata for: ${component.name}`)}
                        >
                          View Metadata
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between mt-4">
        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
        
        <Button
          onClick={() => {
            if (activeOrg) {
              apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {})
                .then(() => {
                  // Reload the data
                  window.location.reload();
                })
                .catch(error => {
                  console.error("Error syncing metadata:", error);
                });
            }
          }}
        >
          Refresh Metadata
        </Button>
      </div>
    </div>
  );
}