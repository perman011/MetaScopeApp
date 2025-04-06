import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrgContext } from '@/hooks/use-org';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, AlertTriangle, FileCode, GitBranch, Layers, Laptop, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// TechnicalDebtItem interface based on schema.ts
interface TechnicalDebtItem {
  id: number;
  componentType: string;
  componentName: string;
  category: string;
  severity: string;
  impact: string;
  effortToFix: string;
  description: string;
  recommendation: string;
  estimatedHours?: number;
  estimatedCost?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  tags?: string[];
  // Supporting both snake_case from DB and camelCase for frontend compatibility
  component_type?: string;
  component_name?: string;
  effort_to_fix?: string;
  estimated_hours?: number;
  estimated_cost?: number;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
}

// Summary metrics interface
interface TechnicalDebtSummary {
  totalItems: number;
  totalEstimatedHours: number;
  totalEstimatedCost: number;
  byCriticality: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byCategory: {
    [key: string]: number;
  };
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    deferred: number;
  };
  byComponent: {
    [key: string]: number;
  };
  trendData: {
    date: string;
    count: number;
  }[];
}

function ProgressIndicator({ value, max, label, variant = 'default' }: { value: number; max: number; label: string; variant?: 'default' | 'warning' | 'critical' }) {
  const percentage = Math.min(100, Math.round((value / max) * 100)) || 0;
  const colorClass = variant === 'critical' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-primary';
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value} / {max}</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-200">
        <div 
          className={`h-full rounded-full ${colorClass}`} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };
  
  return (
    <Badge className={`${colors[severity.toLowerCase()]} border`}>
      {severity}
    </Badge>
  );
};

export default function TechnicalDebtScanner() {
  const { activeOrg } = useOrgContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  
  // Fetch technical debt items
  const { data: technicalDebtItemsData, isLoading, isError } = useQuery({
    queryKey: ['/api/technical-debt', activeOrg?.id],
    enabled: !!activeOrg?.id,
  });
  
  // Ensure we have an array to work with and normalize the data structure
  const technicalDebtItems = React.useMemo(() => {
    if (!Array.isArray(technicalDebtItemsData)) return [];
    
    // Map the data to normalize property names (handling both snake_case from DB and camelCase)
    return technicalDebtItemsData.map(item => ({
      id: item.id,
      componentType: item.componentType || item.component_type || '',
      componentName: item.componentName || item.component_name || '',
      category: item.category || '',
      severity: item.severity || '',
      impact: item.impact || '',
      effortToFix: item.effortToFix || item.effort_to_fix || '',
      description: item.description || '',
      recommendation: item.recommendation || '',
      estimatedHours: item.estimatedHours || item.estimated_hours || 0,
      estimatedCost: item.estimatedCost || item.estimated_cost || 0,
      status: item.status || '',
      createdAt: item.createdAt || item.created_at || '',
      updatedAt: item.updatedAt || item.updated_at || '',
      resolvedAt: item.resolvedAt || item.resolved_at || '',
      tags: item.tags || [],
    }));
  }, [technicalDebtItemsData]);
  
  // Calculate summary metrics
  const summary: TechnicalDebtSummary = React.useMemo(() => {
    if (!technicalDebtItems || technicalDebtItems.length === 0) {
      return {
        totalItems: 0,
        totalEstimatedHours: 0,
        totalEstimatedCost: 0,
        byCriticality: { critical: 0, high: 0, medium: 0, low: 0 },
        byCategory: {},
        byStatus: { open: 0, inProgress: 0, resolved: 0, deferred: 0 },
        byComponent: {},
        trendData: []
      };
    }
    
    const result = {
      totalItems: technicalDebtItems.length,
      totalEstimatedHours: 0,
      totalEstimatedCost: 0,
      byCriticality: { critical: 0, high: 0, medium: 0, low: 0 },
      byCategory: {} as Record<string, number>,
      byStatus: { open: 0, inProgress: 0, resolved: 0, deferred: 0 },
      byComponent: {} as Record<string, number>,
      trendData: [] as { date: string; count: number }[]
    };
    
    // Calculate metrics
    technicalDebtItems.forEach((item: TechnicalDebtItem) => {
      // Sum up estimated hours and cost
      result.totalEstimatedHours += item.estimatedHours || 0;
      result.totalEstimatedCost += item.estimatedCost || 0;
      
      // Count by severity
      const severity = item.severity.toLowerCase();
      if (severity === 'critical') result.byCriticality.critical++;
      else if (severity === 'high') result.byCriticality.high++;
      else if (severity === 'medium') result.byCriticality.medium++;
      else if (severity === 'low') result.byCriticality.low++;
      
      // Count by category
      const category = item.category;
      result.byCategory[category] = (result.byCategory[category] || 0) + 1;
      
      // Count by status
      const status = item.status.toLowerCase().replace(' ', '');
      if (status === 'open') result.byStatus.open++;
      else if (status === 'inprogress') result.byStatus.inProgress++;
      else if (status === 'resolved') result.byStatus.resolved++;
      else if (status === 'deferred') result.byStatus.deferred++;
      
      // Count by component type
      const componentType = item.componentType;
      result.byComponent[componentType] = (result.byComponent[componentType] || 0) + 1;
    });
    
    // Mock trend data (in a real app, this would come from historical snapshots)
    const today = new Date();
    result.trendData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(today.getMonth() - i);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      // Simulate a general upward trend with some randomness
      const baseCount = Math.max(0, result.totalItems - (i * 3));
      const randomFactor = Math.floor(Math.random() * 5);
      return {
        date: monthYear,
        count: Math.max(0, baseCount - randomFactor)
      };
    }).reverse();
    
    return result;
  }, [technicalDebtItems]);
  
  // Filter technical debt items
  const filteredItems = React.useMemo(() => {
    if (!technicalDebtItems) return [];
    
    return technicalDebtItems.filter((item: TechnicalDebtItem) => {
      // Text search
      const matchesSearch = searchTerm === '' || 
        item.componentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
      
      // Severity filter
      const matchesSeverity = severityFilter === 'all' || item.severity.toLowerCase() === severityFilter.toLowerCase();
      
      return matchesSearch && matchesCategory && matchesStatus && matchesSeverity;
    });
  }, [technicalDebtItems, searchTerm, categoryFilter, statusFilter, severityFilter]);
  
  if (!activeOrg) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTitle>No Salesforce Org Selected</AlertTitle>
          <AlertDescription>
            Please select a Salesforce org from the organization dropdown to analyze technical debt.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Technical Debt Scanner</h1>
          <p className="text-muted-foreground">
            Identify, track, and prioritize technical debt in your Salesforce org
          </p>
        </div>
        <Button>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Run New Scan
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load technical debt data. Please try again later.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="issues">Issues List</TabsTrigger>
            <TabsTrigger value="trends">Trends & Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Technical Debt</CardTitle>
                  <CardDescription>Total items requiring remediation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.totalItems}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {summary.totalEstimatedHours} hours estimated effort
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Critical Issues</CardTitle>
                  <CardDescription>High-priority items to fix</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{summary.byCriticality.critical}</div>
                  <Progress 
                    value={(summary.byCriticality.critical / summary.totalItems) * 100} 
                    className="h-2 mt-2"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Estimated Cost</CardTitle>
                  <CardDescription>Based on remediation hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${summary.totalEstimatedCost.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Average: ${Math.round(summary.totalEstimatedCost / (summary.totalItems || 1)).toLocaleString()} per item
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Resolution Progress</CardTitle>
                  <CardDescription>Items resolved vs outstanding</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.round((summary.byStatus.resolved / summary.totalItems) * 100)}%
                  </div>
                  <Progress 
                    value={(summary.byStatus.resolved / summary.totalItems) * 100} 
                    className="h-2 mt-2"
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Issues by Category</CardTitle>
                  <CardDescription>Distribution across different types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ProgressIndicator 
                    value={summary.byCategory['Architecture'] || 0} 
                    max={summary.totalItems} 
                    label="Architecture" 
                    variant={summary.byCategory['Architecture'] > 5 ? 'warning' : 'default'}
                  />
                  <ProgressIndicator 
                    value={summary.byCategory['Code'] || 0} 
                    max={summary.totalItems} 
                    label="Code" 
                    variant={summary.byCategory['Code'] > 10 ? 'critical' : 'default'} 
                  />
                  <ProgressIndicator 
                    value={summary.byCategory['Test Coverage'] || 0} 
                    max={summary.totalItems} 
                    label="Test Coverage" 
                    variant={summary.byCategory['Test Coverage'] > 8 ? 'warning' : 'default'}
                  />
                  <ProgressIndicator 
                    value={summary.byCategory['Documentation'] || 0} 
                    max={summary.totalItems} 
                    label="Documentation" 
                    variant="default"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Issues by Component Type</CardTitle>
                  <CardDescription>Technical debt across different components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ProgressIndicator 
                    value={summary.byComponent['ApexClass'] || 0} 
                    max={summary.totalItems} 
                    label="Apex Classes" 
                    variant={summary.byComponent['ApexClass'] > 10 ? 'warning' : 'default'}
                  />
                  <ProgressIndicator 
                    value={summary.byComponent['ApexTrigger'] || 0} 
                    max={summary.totalItems} 
                    label="Apex Triggers" 
                    variant={summary.byComponent['ApexTrigger'] > 5 ? 'critical' : 'default'}
                  />
                  <ProgressIndicator 
                    value={summary.byComponent['LightningComponent'] || 0} 
                    max={summary.totalItems} 
                    label="Lightning Components" 
                    variant="default"
                  />
                  <ProgressIndicator 
                    value={summary.byComponent['VisualForce'] || 0} 
                    max={summary.totalItems} 
                    label="Visualforce Pages" 
                    variant={summary.byComponent['VisualForce'] > 3 ? 'warning' : 'default'}
                  />
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Top Technical Debt Items</CardTitle>
                <CardDescription>Prioritized by severity and business impact</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Effort to Fix</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.slice(0, 5).map((item: TechnicalDebtItem) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.componentName}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <SeverityBadge severity={item.severity} />
                        </TableCell>
                        <TableCell>{item.effortToFix}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.status.toLowerCase() === 'resolved' ? 'outline' : 'secondary'}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="ml-auto" 
                  onClick={() => {
                    const element = document.querySelector('[data-value="issues"]');
                    if (element instanceof HTMLElement) {
                      element.click();
                    }
                  }}
                >
                  View All Items
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle>Technical Debt Inventory</CardTitle>
                <CardDescription>Comprehensive list of all technical debt items</CardDescription>
                
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by component name or description..." 
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Architecture">Architecture</SelectItem>
                        <SelectItem value="Code">Code</SelectItem>
                        <SelectItem value="Test Coverage">Test Coverage</SelectItem>
                        <SelectItem value="Documentation">Documentation</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="inprogress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="deferred">Deferred</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium">No matching items found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search criteria
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Est. Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item: TechnicalDebtItem) => (
                        <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{item.componentName}</TableCell>
                          <TableCell>{item.componentType}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                          <TableCell>
                            <SeverityBadge severity={item.severity} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.estimatedHours || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Debt Trend</CardTitle>
                  <CardDescription>6-month historical view</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <div className="text-center h-full flex flex-col justify-center items-center">
                    <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Historical Data</h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                      Chart visualization will be displayed here showing technical debt trends over time.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Debt Accrual vs Resolution</CardTitle>
                  <CardDescription>Track remediation progress</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <div className="text-center h-full flex flex-col justify-center items-center">
                    <GitBranch className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Progress Tracking</h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                      Chart visualization will be displayed here showing debt accrual versus resolution rates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Technical Debt Analytics</CardTitle>
                <CardDescription>Insights and metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <h3 className="font-medium">Monthly Change</h3>
                    <div className="text-2xl font-bold text-green-600">-3%</div>
                    <p className="text-sm text-muted-foreground">Decreasing trend from last month</p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-medium">Debt Paydown Rate</h3>
                    <div className="text-2xl font-bold">12 items/month</div>
                    <p className="text-sm text-muted-foreground">Average resolution rate</p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-medium">Resolution Time</h3>
                    <div className="text-2xl font-bold">8.5 days</div>
                    <p className="text-sm text-muted-foreground">Average time to fix</p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="font-medium mb-3">Component Health Trend</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component Type</TableHead>
                        <TableHead>Current Items</TableHead>
                        <TableHead>3 Months Ago</TableHead>
                        <TableHead>6 Months Ago</TableHead>
                        <TableHead>Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Apex Classes</TableCell>
                        <TableCell>{summary.byComponent['ApexClass'] || 0}</TableCell>
                        <TableCell>{Math.round((summary.byComponent['ApexClass'] || 0) * 1.2)}</TableCell>
                        <TableCell>{Math.round((summary.byComponent['ApexClass'] || 0) * 1.4)}</TableCell>
                        <TableCell className="text-green-600">Improving</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Apex Triggers</TableCell>
                        <TableCell>{summary.byComponent['ApexTrigger'] || 0}</TableCell>
                        <TableCell>{Math.round((summary.byComponent['ApexTrigger'] || 0) * 0.9)}</TableCell>
                        <TableCell>{Math.round((summary.byComponent['ApexTrigger'] || 0) * 0.7)}</TableCell>
                        <TableCell className="text-red-600">Worsening</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Lightning Components</TableCell>
                        <TableCell>{summary.byComponent['LightningComponent'] || 0}</TableCell>
                        <TableCell>{Math.round((summary.byComponent['LightningComponent'] || 0) * 1.1)}</TableCell>
                        <TableCell>{Math.round((summary.byComponent['LightningComponent'] || 0) * 1.3)}</TableCell>
                        <TableCell className="text-green-600">Improving</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Visualforce Pages</TableCell>
                        <TableCell>{summary.byComponent['VisualForce'] || 0}</TableCell>
                        <TableCell>{summary.byComponent['VisualForce'] || 0}</TableCell>
                        <TableCell>{Math.round((summary.byComponent['VisualForce'] || 0) * 0.9)}</TableCell>
                        <TableCell className="text-amber-600">Stable</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommendations">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <CardTitle>Critical Issues</CardTitle>
                  <CardDescription>Immediate attention required</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <div className="min-w-4 pt-0.5">•</div>
                      <span>Fix SOQL queries in loops in <strong>AccountController</strong> to prevent governor limits</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="min-w-4 pt-0.5">•</div>
                      <span>Remove hardcoded IDs in <strong>OpportunityTrigger</strong> causing security vulnerabilities</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="min-w-4 pt-0.5">•</div>
                      <span>Add sharing rules to <strong>LeadService</strong> class to enforce proper access controls</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">View Critical Issues</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                    <Layers className="h-6 w-6" />
                  </div>
                  <CardTitle>Architecture Improvements</CardTitle>
                  <CardDescription>Structural enhancements</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <div className="min-w-4 pt-0.5">•</div>
                      <span>Implement service layer pattern for <strong>Product</strong> related classes</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="min-w-4 pt-0.5">•</div>
                      <span>Move business logic from triggers to handler classes for <strong>Case</strong> objects</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="min-w-4 pt-0.5">•</div>
                      <span>Split large <strong>UtilityClass</strong> into focused, single-responsibility classes</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">View Architecture Recommendations</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <Laptop className="h-6 w-6" />
                  </div>
                  <CardTitle>Modern Development</CardTitle>
                  <CardDescription>Modernization opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <div className="min-w-4 pt-0.5">•</div>
                      <span>Migrate <strong>ProductCatalog</strong> Visualforce page to Lightning Web Components</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="min-w-4 pt-0.5">•</div>
                      <span>Update Apex API version in <strong>14 classes</strong> to use newer Salesforce features</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="min-w-4 pt-0.5">•</div>
                      <span>Replace JavaScript buttons with Lightning actions in <strong>Order</strong> object</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">View Modernization Plan</Button>
                </CardFooter>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Technical Debt Roadmap</CardTitle>
                <CardDescription>Prioritized plan to reduce technical debt over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-bold mr-2">NOW</span>
                      Immediate Actions (0-30 days)
                    </h3>
                    <div className="pl-6 border-l-2 border-red-200 ml-1 space-y-4">
                      <div>
                        <h4 className="font-medium">Fix Critical Security Issues</h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          Address high-severity issues that pose security risks
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Estimated: 12 hours</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">Resolve Governor Limit Risks</h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          Fix SOQL queries in loops and bulkify trigger operations
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Estimated: 8 hours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold mr-2">SOON</span>
                      Short-term Improvements (1-3 months)
                    </h3>
                    <div className="pl-6 border-l-2 border-amber-200 ml-1 space-y-4">
                      <div>
                        <h4 className="font-medium">Improve Test Coverage</h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          Increase test coverage for business-critical Apex classes
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Estimated: 40 hours</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">Refactor Large Classes</h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          Split utility classes into smaller, focused components
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Estimated: 24 hours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold mr-2">LATER</span>
                      Long-term Strategy (3-12 months)
                    </h3>
                    <div className="pl-6 border-l-2 border-green-200 ml-1 space-y-4">
                      <div>
                        <h4 className="font-medium">Migrate Legacy UI Components</h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          Convert Visualforce pages to Lightning Web Components
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Estimated: 120 hours</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">Implement Architectural Patterns</h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          Apply domain-driven design and service layer patterns
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Estimated: 80 hours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline">
                  Export Roadmap
                </Button>
                <Button className="ml-2">
                  Create JIRA Tasks
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}