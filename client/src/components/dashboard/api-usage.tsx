import { useState } from "react";
import { useOrgContext } from "@/hooks/use-org";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Mock API usage data (in a real app, this would come from the backend)
const mockApiUsageData = [
  { date: "2025-03-01", count: 1234, type: "rest" },
  { date: "2025-03-02", count: 2341, type: "rest" },
  { date: "2025-03-03", count: 1854, type: "rest" },
  { date: "2025-03-04", count: 1492, type: "rest" },
  { date: "2025-03-05", count: 2485, type: "rest" },
  { date: "2025-03-06", count: 3210, type: "rest" },
  { date: "2025-03-07", count: 2987, type: "rest" },
  { date: "2025-03-01", count: 543, type: "soap" },
  { date: "2025-03-02", count: 654, type: "soap" },
  { date: "2025-03-03", count: 798, type: "soap" },
  { date: "2025-03-04", count: 502, type: "soap" },
  { date: "2025-03-05", count: 687, type: "soap" },
  { date: "2025-03-06", count: 543, type: "soap" },
  { date: "2025-03-07", count: 621, type: "soap" },
  { date: "2025-03-01", count: 345, type: "bulk" },
  { date: "2025-03-02", count: 421, type: "bulk" },
  { date: "2025-03-03", count: 532, type: "bulk" },
  { date: "2025-03-04", count: 287, type: "bulk" },
  { date: "2025-03-05", count: 389, type: "bulk" },
  { date: "2025-03-06", count: 423, type: "bulk" },
  { date: "2025-03-07", count: 356, type: "bulk" },
];

// Aggregate by date for daily totals
const aggregatedByDate = mockApiUsageData.reduce((acc, curr) => {
  const existingIndex = acc.findIndex(item => item.date === curr.date);
  if (existingIndex >= 0) {
    acc[existingIndex].count += curr.count;
  } else {
    acc.push({
      date: curr.date,
      count: curr.count
    });
  }
  return acc;
}, [] as { date: string; count: number }[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

// Format data for API type comparison
const apiTypeData = [
  { name: "REST API", value: mockApiUsageData.filter(d => d.type === "rest").reduce((sum, item) => sum + item.count, 0) },
  { name: "SOAP API", value: mockApiUsageData.filter(d => d.type === "soap").reduce((sum, item) => sum + item.count, 0) },
  { name: "Bulk API", value: mockApiUsageData.filter(d => d.type === "bulk").reduce((sum, item) => sum + item.count, 0) },
];

export default function ApiUsage() {
  const { activeOrg } = useOrgContext();
  const [dateRange, setDateRange] = useState<string>("7days");
  const [viewType, setViewType] = useState<string>("daily");
  
  // In a real app, this would be a real API request with the org ID
  const { isLoading } = useQuery({
    queryKey: [`/api/orgs/${activeOrg?.id}/api-usage`],
    enabled: !!activeOrg,
  });

  const getFilteredData = () => {
    // In a real app, this filtering would be done on the server
    return aggregatedByDate;
  };
  
  const getTrendData = () => {
    // In a real app, this would be real data from the API
    return aggregatedByDate;
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>API Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!activeOrg) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No Salesforce Org Connected</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Connect a Salesforce org to view API usage analytics.
          </p>
          <Button>Connect Salesforce Org</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Usage Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <Select value={viewType} onValueChange={setViewType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="View Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Breakdown</SelectItem>
                <SelectItem value="weekly">Weekly Aggregation</SelectItem>
                <SelectItem value="apiType">By API Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="flex-shrink-0">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
        
        {/* Usage Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="text-sm text-neutral-500 mb-1">Total API Calls</div>
            <div className="text-2xl font-semibold">
              {aggregatedByDate.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="text-sm text-neutral-500 mb-1">Daily Average</div>
            <div className="text-2xl font-semibold">
              {Math.round(aggregatedByDate.reduce((sum, item) => sum + item.count, 0) / aggregatedByDate.length).toLocaleString()}
            </div>
          </div>
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="text-sm text-neutral-500 mb-1">API Limit Usage</div>
            <div className="text-2xl font-semibold text-green-500">
              36%
            </div>
          </div>
        </div>
        
        {/* Main Chart */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="text-base font-medium mb-4">
            {viewType === 'apiType' ? 'API Usage by Type' : 'API Usage Trend'}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {viewType === 'apiType' ? (
                <BarChart
                  data={apiTypeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" name="API Calls" fill="#6366F1" />
                </BarChart>
              ) : (
                <LineChart
                  data={getFilteredData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="API Calls"
                    stroke="#6366F1"
                    strokeWidth={2}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Usage Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-base font-medium text-blue-700 mb-2">Optimization Recommendations</h3>
          <ul className="text-sm text-blue-600 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Consider using Bulk API for large data operations to reduce API call volume.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Implement API call caching for frequently accessed data.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Review applications with high API consumption for optimization opportunities.</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}