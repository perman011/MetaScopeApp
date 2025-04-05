import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  ArrowDown, 
  ArrowUp, 
  BarChart2, 
  Calendar, 
  Check, 
  Clock, 
  CloudOff, 
  Database, 
  Filter, 
  GitMerge, 
  Info, 
  RefreshCw, 
  Server, 
  Settings, 
  Sliders, 
  Zap
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
} from 'recharts';

// Custom progress component that accepts a custom className for the indicator
interface CustomProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorClassName?: string;
}

const CustomProgress = ({
  value,
  max = 100,
  className,
  indicatorClassName,
  ...props
}: CustomProgressProps) => {
  const percentage = (value / max) * 100;
  
  // Determine color based on value (for API usage, lower is better)
  const getDefaultColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-neutral-200 ${className}`}
      {...props}
    >
      <div
        className={`h-full ${indicatorClassName || getDefaultColor()}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Interface for API Usage data
interface ApiUsageData {
  // Daily limits
  dailyApiRequests: {
    used: number;
    total: number;
  };
  
  // Per-user API requests
  concurrentApiRequests: {
    used: number;
    total: number;
  };
  
  // API request types
  requestsByType: {
    type: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  
  // API request methods
  requestsByMethod: {
    method: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  
  // Top API consumers (users/integrations)
  topConsumers: {
    name: string;
    requests: number;
    percentage: number;
  }[];
  
  // Error rates
  errorRates: {
    type: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  
  // API usage over time (7 days)
  usageTrend: {
    date: string;
    requests: number;
    limit: number;
  }[];
  
  // Response time metrics
  responseTime: {
    average: number; // in ms
    percentile95: number; // in ms
    percentile99: number; // in ms
  };
  
  // Batch vs. single record operations
  batchEfficiency: {
    batchOperations: number;
    singleOperations: number;
    potentialBatchSavings: number;
  };
  
  // Rate limiting events
  rateLimitEvents: {
    date: string;
    count: number;
    duration: number; // in minutes
  }[];
  
  // Optimization recommendations
  optimizationRecommendations: {
    id: string;
    title: string;
    description: string;
    impact: string; // high, medium, low
    type: string; // performance, limit, efficiency
  }[];
}

// Main component
interface ApiUsageProps {
  orgId: number;
  apiUsageData: ApiUsageData;
  isLoading?: boolean;
  onRefresh?: () => void;
  onActionClick?: (actionId: string) => void;
}

// Main component
export function ApiUsage({ 
  orgId,
  apiUsageData, 
  isLoading = false,
  onRefresh,
  onActionClick,
}: ApiUsageProps) {
  const [timeframe, setTimeframe] = useState('7d');
  
  // Simulating loading state or handling missing data
  if (isLoading || !apiUsageData) {
    return (
      <div className="w-full p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  const data = apiUsageData;
  
  // Handle action clicks
  const handleAction = (actionId: string) => {
    if (onActionClick) {
      onActionClick(actionId);
    } else {
      toast({
        title: "Action triggered",
        description: `Action ${actionId} would be executed in production`,
      });
    }
  };
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">API Usage Analytics</h1>
        <div className="flex items-center space-x-2">
          <Select defaultValue={timeframe} onValueChange={(value) => setTimeframe(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => onRefresh && onRefresh()}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Database className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="detailed">
            <BarChart2 className="h-4 w-4 mr-2" />
            Detailed Analysis
          </TabsTrigger>
          <TabsTrigger value="optimization">
            <Sliders className="h-4 w-4 mr-2" />
            Optimization
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Daily API Usage Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-500" />
                  Daily API Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-2xl font-bold">
                      {formatNumber(data.dailyApiRequests.used)}
                    </span>
                    <span className="text-neutral-500 text-sm">
                      of {formatNumber(data.dailyApiRequests.total)}
                    </span>
                  </div>
                  
                  <CustomProgress
                    value={data.dailyApiRequests.used}
                    max={data.dailyApiRequests.total}
                    className="h-2 mb-2"
                  />
                  
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-neutral-600">
                      {Math.round((data.dailyApiRequests.used / data.dailyApiRequests.total) * 100)}% used
                    </span>
                    <span className="text-neutral-600">
                      {formatNumber(data.dailyApiRequests.total - data.dailyApiRequests.used)} remaining
                    </span>
                  </div>
                  
                  {data.dailyApiRequests.used / data.dailyApiRequests.total > 0.8 && (
                    <Alert className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 text-sm font-medium">High usage detected</AlertTitle>
                      <AlertDescription className="text-amber-700 text-xs">
                        Consider optimizing API requests to avoid hitting limits.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAction('analyze-api-usage')}
                >
                  View Usage Details
                </Button>
              </CardFooter>
            </Card>
            
            {/* API Request Types Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <GitMerge className="h-5 w-5 mr-2 text-purple-500" />
                  API Request Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.requestsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {data.requestsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatNumber(value), 'Requests']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {data.requestsByType.map((type, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      ></div>
                      <span className="text-xs">{type.type}</span>
                      <span className="text-xs text-neutral-500 ml-auto">{type.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Response Time Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-500" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-600">Average</span>
                      <span className="font-medium">{data.responseTime.average} ms</span>
                    </div>
                    <CustomProgress
                      value={data.responseTime.average}
                      max={2000} // Assuming 2 seconds is the benchmark
                      className="h-1.5"
                      indicatorClassName={data.responseTime.average < 500 ? 'bg-green-500' : data.responseTime.average < 1000 ? 'bg-amber-500' : 'bg-red-500'}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-600">95th Percentile</span>
                      <span className="font-medium">{data.responseTime.percentile95} ms</span>
                    </div>
                    <CustomProgress
                      value={data.responseTime.percentile95}
                      max={3000} // Assuming 3 seconds is the benchmark
                      className="h-1.5"
                      indicatorClassName={data.responseTime.percentile95 < 1000 ? 'bg-green-500' : data.responseTime.percentile95 < 2000 ? 'bg-amber-500' : 'bg-red-500'}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-600">99th Percentile</span>
                      <span className="font-medium">{data.responseTime.percentile99} ms</span>
                    </div>
                    <CustomProgress
                      value={data.responseTime.percentile99}
                      max={5000} // Assuming 5 seconds is the benchmark
                      className="h-1.5"
                      indicatorClassName={data.responseTime.percentile99 < 1500 ? 'bg-green-500' : data.responseTime.percentile99 < 3000 ? 'bg-amber-500' : 'bg-red-500'}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAction('analyze-response-times')}
                >
                  Optimize Response Times
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* API Usage Trend Chart */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-500" />
                API Request Trend ({timeframe === '1d' ? 'Today' : timeframe === '7d' ? 'Last 7 Days' : timeframe === '30d' ? 'Last 30 Days' : 'Last Quarter'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.usageTrend}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatNumber(value), 'Requests']} 
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#3B82F6" 
                      fillOpacity={1} 
                      fill="url(#colorRequests)" 
                      name="API Requests" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="limit" 
                      stroke="#F87171" 
                      fill="none" 
                      strokeDasharray="5 5" 
                      name="Daily Limit" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Error Rates */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  Error Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.errorRates}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [formatNumber(value), 'Errors']}
                      />
                      <Bar dataKey="count" name="Error Count">
                        {data.errorRates.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {data.errorRates.some(error => error.percentage > 5) && (
                  <Alert className="mt-2 bg-red-50 border-red-200 text-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-800 text-sm font-medium">High error rate detected</AlertTitle>
                    <AlertDescription className="text-red-700 text-xs">
                      Investigate {data.errorRates.find(error => error.percentage > 5)?.type} errors to improve reliability.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* Top API Consumers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Server className="h-5 w-5 mr-2 text-indigo-500" />
                  Top API Consumers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topConsumers.slice(0, 5).map((consumer, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="w-1/3 text-sm truncate" title={consumer.name}>{consumer.name}</div>
                      <div className="w-2/3 relative pt-1">
                        <div className="flex mb-1 items-center">
                          <div className="w-full bg-indigo-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-500 h-2 rounded-full" 
                              style={{ width: `${consumer.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs ml-2 w-16 text-right">
                            {formatNumber(consumer.requests)} <span className="text-neutral-500">({consumer.percentage}%)</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => handleAction('view-all-consumers')}
                >
                  View All Consumers
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* DETAILED ANALYSIS TAB */}
        <TabsContent value="detailed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Request Methods */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-blue-500" />
                  API Methods Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.requestsByMethod}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.requestsByMethod.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatNumber(value), 'Requests']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-2">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="methods-details">
                      <AccordionTrigger className="text-sm">
                        View Method Details
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {data.requestsByMethod.map((method, i) => (
                            <div key={i} className="grid grid-cols-3 text-xs">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: method.color }}
                                ></div>
                                {method.method}
                              </div>
                              <div className="text-center">{formatNumber(method.count)}</div>
                              <div className="text-right">{method.percentage}%</div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>
            
            {/* Batch vs. Single Analysis */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <GitMerge className="h-5 w-5 mr-2 text-green-500" />
                  Batch Efficiency Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Batch Operations</span>
                    <span className="text-sm font-medium">{formatNumber(data.batchEfficiency.batchOperations)}</span>
                  </div>
                  <CustomProgress
                    value={data.batchEfficiency.batchOperations}
                    max={data.batchEfficiency.batchOperations + data.batchEfficiency.singleOperations}
                    className="h-2"
                    indicatorClassName="bg-green-500"
                  />
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Single Record Operations</span>
                    <span className="text-sm font-medium">{formatNumber(data.batchEfficiency.singleOperations)}</span>
                  </div>
                  <CustomProgress
                    value={data.batchEfficiency.singleOperations}
                    max={data.batchEfficiency.batchOperations + data.batchEfficiency.singleOperations}
                    className="h-2"
                    indicatorClassName="bg-amber-500"
                  />
                </div>
                
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 text-sm font-medium">Batch Optimization Opportunity</AlertTitle>
                  <AlertDescription className="text-green-700 text-xs">
                    Converting single operations to batch could save approximately {formatNumber(data.batchEfficiency.potentialBatchSavings)} API requests.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => handleAction('optimize-batch-operations')}
                >
                  View Optimization Recommendations
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Rate Limiting Events */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CloudOff className="h-5 w-5 mr-2 text-red-500" />
                Rate Limiting Events
              </CardTitle>
              <CardDescription>
                Times when API requests were throttled or rejected due to exceeding limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.rateLimitEvents.length > 0 ? (
                <div className="space-y-2">
                  {data.rateLimitEvents.map((event, i) => (
                    <div key={i} className="border-b border-neutral-200 pb-2 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                          <span className="text-sm">{event.date}</span>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {event.count} rejections
                        </Badge>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Rate limiting duration: {event.duration} minutes
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-neutral-500">
                  <Check className="h-8 w-8 mb-2 text-green-500" />
                  <p className="text-sm">No rate limiting events detected in this period</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Concurrent API Requests */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-500" />
                Concurrent API Request Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-2xl font-bold">
                    {data.concurrentApiRequests.used}
                  </span>
                  <span className="text-neutral-500 text-sm">
                    of {data.concurrentApiRequests.total}
                  </span>
                </div>
                
                <CustomProgress
                  value={data.concurrentApiRequests.used}
                  max={data.concurrentApiRequests.total}
                  className="h-2 mb-2"
                />
                
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-neutral-600">
                    {Math.round((data.concurrentApiRequests.used / data.concurrentApiRequests.total) * 100)}% used
                  </span>
                  <span className="text-neutral-600">
                    {data.concurrentApiRequests.total - data.concurrentApiRequests.used} available
                  </span>
                </div>
                
                <div className="bg-neutral-100 rounded-md p-3 mt-4 text-sm">
                  <p className="text-neutral-600">
                    <Info className="inline h-4 w-4 mr-1 text-neutral-500" />
                    Concurrent API requests are limited per user/transaction and affect parallel operations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* OPTIMIZATION TAB */}
        <TabsContent value="optimization">
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800 font-medium">Optimization Recommendations</AlertTitle>
              <AlertDescription className="text-blue-700">
                These suggestions can help reduce API usage and improve application performance.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              {data.optimizationRecommendations.map((rec, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center">
                        {rec.type === 'performance' ? (
                          <Zap className="h-5 w-5 mr-2 text-amber-500" />
                        ) : rec.type === 'limit' ? (
                          <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                        ) : (
                          <Settings className="h-5 w-5 mr-2 text-blue-500" />
                        )}
                        {rec.title}
                      </CardTitle>
                      <Badge 
                        className={
                          rec.impact === 'high' 
                            ? 'bg-red-100 text-red-800 hover:bg-red-100' 
                            : rec.impact === 'medium'
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                        }
                      >
                        {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)} Impact
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-600 mb-4">
                      {rec.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(`implement-${rec.id}`)}
                    >
                      View Implementation Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-indigo-500" />
                  Custom Optimization Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  Request a custom analysis of your API usage patterns to identify additional optimization opportunities.
                </p>
                <Button
                  onClick={() => handleAction('request-custom-analysis')}
                >
                  Request Custom Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* MONITORING TAB */}
        <TabsContent value="monitoring">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-500" />
                  Usage Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm">Daily API limit threshold</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">80%</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAction('configure-daily-limit-alert')}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm">Rate limiting alert</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Enabled</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAction('configure-rate-limit-alert')}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm">Error rate threshold</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">5%</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAction('configure-error-rate-alert')}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm">Response time threshold</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">1000ms</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAction('configure-response-time-alert')}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Server className="h-5 w-5 mr-2 text-purple-500" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm">Email notifications</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Enabled</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAction('configure-email-notifications')}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm">Slack notifications</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Disabled</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAction('configure-slack-notifications')}
                      >
                        Setup
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm">MS Teams notifications</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Disabled</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAction('configure-teams-notifications')}
                      >
                        Setup
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm">SMS notifications</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Disabled</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAction('configure-sms-notifications')}
                      >
                        Setup
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-500" />
                Scheduled Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm">Daily usage summary</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">Every day at 8:00 AM</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAction('configure-daily-report')}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm">Weekly trend analysis</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">Every Monday at 9:00 AM</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAction('configure-weekly-report')}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm">Monthly executive summary</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">1st of each month</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAction('configure-monthly-report')}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full mt-4"
                onClick={() => handleAction('add-new-report')}
              >
                Add New Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Placeholder for missing components
const Users = Activity; // Using Activity icon as placeholder since Users wasn't imported

// Add default export to make imports work
export default ApiUsage;