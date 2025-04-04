import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import OrgHealth from "@/components/dashboard/org-health";
import FieldIntelligence from "@/components/dashboard/field-intelligence";
import ApiUsage from "@/components/dashboard/api-usage";
import { useOrgContext } from "@/hooks/use-org";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Search, Database, BarChart2, Activity } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { HealthScore, Metadata } from "@shared/schema";

// Mock metadata for analytics display
const mockMetadataTypes = [
  { name: "ApexClass", count: 145, lastModified: "2025-03-15", category: "Apex" },
  { name: "ApexTrigger", count: 32, lastModified: "2025-03-10", category: "Apex" },
  { name: "CustomObject", count: 87, lastModified: "2025-03-12", category: "Metadata" },
  { name: "CustomField", count: 643, lastModified: "2025-03-14", category: "Metadata" },
  { name: "Layout", count: 92, lastModified: "2025-03-05", category: "UI" },
  { name: "Flow", count: 58, lastModified: "2025-03-08", category: "Automation" },
  { name: "ValidationRule", count: 74, lastModified: "2025-03-09", category: "Automation" },
  { name: "LightningComponent", count: 103, lastModified: "2025-03-11", category: "UI" },
  { name: "StaticResource", count: 47, lastModified: "2025-02-28", category: "UI" },
  { name: "PermissionSet", count: 29, lastModified: "2025-03-02", category: "Security" },
  { name: "Profile", count: 18, lastModified: "2025-03-07", category: "Security" },
  { name: "CustomLabel", count: 213, lastModified: "2025-03-01", category: "Metadata" },
  { name: "ReportType", count: 36, lastModified: "2025-02-25", category: "Reporting" },
  { name: "Dashboard", count: 52, lastModified: "2025-03-03", category: "Reporting" },
  { name: "WorkflowRule", count: 43, lastModified: "2025-03-08", category: "Automation" },
];

// Mock metadata category colors for charts
const categoryColors = {
  Apex: '#6366F1',
  Metadata: '#22C55E',
  UI: '#EC4899',
  Automation: '#F59E0B',
  Security: '#EF4444',
  Reporting: '#06B6D4',
};

// COLORS for pie chart segments
const COLORS = ['#6366F1', '#22C55E', '#EC4899', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6'];

export default function Dashboard() {
  const { activeOrg } = useOrgContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("count");
  const [viewType, setViewType] = useState("table");

  // Fetch health score for active org
  const { data: healthScore, isLoading: isHealthScoreLoading } = useQuery<HealthScore>({
    queryKey: [`/api/orgs/${activeOrg?.id}/health`],
    enabled: !!activeOrg,
  });

  // Fetch metadata for active org
  const { data: metadata, isLoading: isMetadataLoading } = useQuery<Metadata[]>({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata`],
    enabled: !!activeOrg,
  });

  // Define the expected type for metadata items
  interface MetadataItem {
    name: string;
    count: number;
    lastModified: string;
    category: string;
  }
  
  // Create a processed metadata list using real API data if available, otherwise use mock data
  const processedMetadataList: MetadataItem[] = metadata && Array.isArray(metadata) && metadata.length > 0 ? 
    metadata.map((item: any) => ({
      name: item.name || 'Unknown',
      count: item.count || 0,
      lastModified: item.lastModified || new Date().toISOString().split('T')[0],
      category: item.type || 'Metadata'
    })) : 
    mockMetadataTypes;
  
  // Filter and sort metadata based on user selections
  const filteredMetadata = processedMetadataList
    .filter(item => {
      // Apply search filter
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Apply category filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === "count") {
        return b.count - a.count;
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "lastModified") {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
      return 0;
    });

  // Define the chart data type
  interface ChartDataItem {
    name: string;
    value: number;
    color: string;
  }
  
  // Calculate aggregate data for charts using real API data if available
  const categoryData: ChartDataItem[] = Object.entries(
    processedMetadataList.reduce((acc: Record<string, number>, item: MetadataItem) => {
      acc[item.category] = (acc[item.category] || 0) + item.count;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length]
  }));

  // Analyze org if no health score exists
  useEffect(() => {
    if (activeOrg && !isHealthScoreLoading && !healthScore) {
      const analyzeOrg = async () => {
        try {
          await apiRequest("POST", `/api/orgs/${activeOrg.id}/analyze`);
        } catch (error) {
          console.error("Error analyzing org:", error);
        }
      };
      analyzeOrg();
    }
  }, [activeOrg, healthScore, isHealthScoreLoading]);

  // Sync metadata if none exists
  useEffect(() => {
    if (activeOrg && !isMetadataLoading && (!metadata || metadata.length === 0)) {
      const syncMetadata = async () => {
        try {
          await apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {});
        } catch (error) {
          console.error("Error syncing metadata:", error);
        }
      };
      syncMetadata();
    }
  }, [activeOrg, metadata, isMetadataLoading]);

  // Extract tab from the URL if present
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("org-health");
  
  // Set the active tab based on URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLocation(`/dashboard?tab=${value}`);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Overview of your Salesforce org's health and metadata
          </p>
        </div>
        
        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="org-health" className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              <span>Org Health</span>
            </TabsTrigger>
            <TabsTrigger value="field-intelligence" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              <span>Field Intelligence</span>
            </TabsTrigger>
            <TabsTrigger value="api-usage" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              <span>API Usage</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="org-health">
            <OrgHealth />
          </TabsContent>
          
          <TabsContent value="field-intelligence">
            {activeOrg ? (
              <FieldIntelligence orgId={activeOrg.id} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-medium mb-2">No Salesforce Org Connected</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Connect a Salesforce org to view field intelligence analytics.
                  </p>
                  <Button>Connect Salesforce Org</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="api-usage">
            <ApiUsage />
          </TabsContent>
        </Tabs>
        
        {/* Advanced Metadata Analytics */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl">Metadata Analytics</CardTitle>
                <CardDescription>
                  Analyze metadata distribution and trends across your org
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-2">
                <ToggleGroup type="single" value={viewType} onValueChange={(value) => value && setViewType(value)}>
                  <ToggleGroupItem value="table" aria-label="Toggle table view">
                    Table
                  </ToggleGroupItem>
                  <ToggleGroupItem value="bar" aria-label="Toggle bar chart view">
                    Bar
                  </ToggleGroupItem>
                  <ToggleGroupItem value="pie" aria-label="Toggle pie chart view">
                    Pie
                  </ToggleGroupItem>
                </ToggleGroup>
                
                <Button variant="outline" size="sm" onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory(null);
                  setSortBy("count");
                }}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filters Section */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-1/2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search metadata..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-4 w-full sm:w-1/2">
                  <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? null : val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Apex">Apex</SelectItem>
                      <SelectItem value="Metadata">Metadata</SelectItem>
                      <SelectItem value="UI">UI</SelectItem>
                      <SelectItem value="Automation">Automation</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Reporting">Reporting</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">Count (Highest First)</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="lastModified">Last Modified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedCategory && (
                <div className="flex items-center">
                  <span className="text-sm mr-2">Active filter:</span>
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="ml-1 rounded-full hover:bg-neutral-100 p-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </Badge>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                Showing {filteredMetadata.length} of {processedMetadataList.length} metadata types
              </div>
            </div>
            
            {/* Data Visualization Section */}
            {viewType === "table" && (
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-neutral-50">
                      <th className="text-left p-3 text-xs font-medium text-neutral-600">Name</th>
                      <th className="text-left p-3 text-xs font-medium text-neutral-600">Category</th>
                      <th className="text-left p-3 text-xs font-medium text-neutral-600">Count</th>
                      <th className="text-left p-3 text-xs font-medium text-neutral-600">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMetadata.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-neutral-50">
                        <td className="p-3 text-sm font-medium">
                          {item.name}
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline" style={{
                            color: categoryColors[item.category as keyof typeof categoryColors],
                            backgroundColor: `${categoryColors[item.category as keyof typeof categoryColors]}15`,
                            borderColor: `${categoryColors[item.category as keyof typeof categoryColors]}30`,
                          }}>
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{item.count.toLocaleString()}</td>
                        <td className="p-3 text-sm">{item.lastModified}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {viewType === "bar" && (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredMetadata.slice(0, 10)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: number, name: string, props: any) => [value.toLocaleString(), 'Count']}
                      labelFormatter={(label: string) => `Metadata: ${label}`}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Count" 
                      fill="#6366F1" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {viewType === "pie" && (
              <div className="w-full h-80 flex flex-col md:flex-row items-center justify-center">
                <div className="w-full md:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        // Use shorter labels directly on pie chart
                        label={({name, percent}: {name: string, percent: number}) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number, name: string, props: any) => {
                          // Show full category name and count in tooltip
                          return [`${value.toLocaleString()} components`, props.payload.name];
                        }}
                        labelFormatter={(label: string) => `Category: ${label}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 flex flex-col gap-2 md:pl-8">
                  <h3 className="text-sm font-medium">Metadata by Category</h3>
                  <ul className="space-y-2">
                    {categoryData.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-medium">{item.name}:</span>
                        <span className="text-sm">{item.value.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        

      </div>
    </div>
  );
}
