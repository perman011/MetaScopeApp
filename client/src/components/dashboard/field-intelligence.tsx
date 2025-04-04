import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { 
  Database, 
  Filter, 
  Search, 
  AlertTriangle, 
  BarChart as BarChartIcon, 
  RefreshCw, 
  Share2, 
  CheckCircle, 
  Archive,
  AlertCircle,
} from "lucide-react";

interface FieldIntelligenceProps {
  orgId: number;
}

interface FieldUsageData {
  name: string;
  object: string;
  usageCount: number;
  lastUsed: string | null;
  type: string;
  isCustom: boolean;
}

interface FieldNamingInsight {
  inconsistentName: string;
  suggestedName: string;
  objects: string[];
  impact: 'high' | 'medium' | 'low';
}

interface FieldLabelInsight {
  fieldName: string;
  object: string;
  labelLength: number;
  tooltipLength: number | null;
}

export default function FieldIntelligence({ orgId }: FieldIntelligenceProps) {
  const [selectedObject, setSelectedObject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('unused');

  // Fetch field usage metrics
  const { data: fieldData, isLoading } = useQuery<any>({
    queryKey: [`/api/orgs/${orgId}/metadata/fields/usage`],
    enabled: Boolean(orgId),
  });

  // Fetch objects for the filter
  const { data: objects, isLoading: objectsLoading } = useQuery<string[]>({
    queryKey: [`/api/orgs/${orgId}/metadata/objects`],
    enabled: Boolean(orgId),
  });

  // Process field data for unused fields
  const getUnusedFields = (): FieldUsageData[] => {
    if (!fieldData?.fields) return [];
    return fieldData.fields
      .filter((field: FieldUsageData) => 
        field.usageCount === 0 && 
        (selectedObject === 'all' || field.object === selectedObject) &&
        (searchTerm === '' || 
          field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.object.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .sort((a: FieldUsageData, b: FieldUsageData) => 
        a.isCustom === b.isCustom ? 0 : a.isCustom ? -1 : 1
      );
  };

  // Process field data for most used fields in filters
  const getMostFilteredFields = (): FieldUsageData[] => {
    if (!fieldData?.fields) return [];
    return fieldData.fields
      .filter((field: FieldUsageData) => 
        (selectedObject === 'all' || field.object === selectedObject) &&
        (searchTerm === '' || 
          field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.object.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .sort((a: FieldUsageData, b: FieldUsageData) => b.usageCount - a.usageCount)
      .slice(0, 10);
  };

  // Get inconsistent field naming
  const getInconsistentNaming = (): FieldNamingInsight[] => {
    if (!fieldData?.namingInconsistencies) return [];
    return fieldData.namingInconsistencies
      .filter((insight: FieldNamingInsight) => 
        (searchTerm === '' || 
          insight.inconsistentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          insight.objects.some(obj => obj.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      )
      .sort((a: FieldNamingInsight, b: FieldNamingInsight) => {
        // Sort by impact level
        const impactOrder = { high: 0, medium: 1, low: 2 };
        return impactOrder[a.impact] - impactOrder[b.impact];
      });
  };

  // Get fields with long labels or tooltips
  const getLongLabelFields = (): FieldLabelInsight[] => {
    if (!fieldData?.longLabels) return [];
    return fieldData.longLabels
      .filter((insight: FieldLabelInsight) => 
        (selectedObject === 'all' || insight.object === selectedObject) &&
        (searchTerm === '' || 
          insight.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          insight.object.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .sort((a: FieldLabelInsight, b: FieldLabelInsight) => 
        (b.labelLength + (b.tooltipLength || 0)) - (a.labelLength + (a.tooltipLength || 0))
      );
  };

  // Chart data for field types
  const getFieldTypeChartData = () => {
    if (!fieldData?.fieldsByType) return [];
    return Object.entries(fieldData.fieldsByType).map(([type, count]) => ({
      name: type,
      value: count as number
    }));
  };

  // Chart data for unused vs used fields
  const getUsageRatioData = () => {
    if (!fieldData?.totalFieldsCount || !fieldData?.unusedFieldsCount) return [];
    return [
      { name: 'Used', value: fieldData.totalFieldsCount - fieldData.unusedFieldsCount },
      { name: 'Unused', value: fieldData.unusedFieldsCount }
    ];
  };

  // Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (isLoading) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Field Intelligence
          </CardTitle>
          <CardDescription>
            Analyze field usage patterns and optimization opportunities
          </CardDescription>
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

  const unusedFields = getUnusedFields();
  const mostFilteredFields = getMostFilteredFields();
  const inconsistentNaming = getInconsistentNaming();
  const longLabelFields = getLongLabelFields();
  const fieldTypeChartData = getFieldTypeChartData();
  const usageRatioData = getUsageRatioData();

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Field Intelligence
        </CardTitle>
        <CardDescription>
          Analyze field usage patterns and optimization opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter controls */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search fields or objects..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            value={selectedObject} 
            onValueChange={setSelectedObject}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select object" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Objects</SelectItem>
              {objects?.map((object) => (
                <SelectItem key={object} value={object}>
                  {object}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setSearchTerm('');
              setSelectedObject('all');
            }}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="text-sm text-neutral-500 mb-1">Total Fields</div>
            <div className="text-2xl font-semibold">{fieldData?.totalFieldsCount || 0}</div>
          </div>
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="text-sm text-neutral-500 mb-1">Unused Fields</div>
            <div className="text-2xl font-semibold text-amber-500">
              {fieldData?.unusedFieldsCount || 0}
            </div>
          </div>
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="text-sm text-neutral-500 mb-1">Naming Issues</div>
            <div className="text-2xl font-semibold text-red-500">
              {fieldData?.namingInconsistencies?.length || 0}
            </div>
          </div>
        </div>

        {/* Usage vs Types Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Field Usage</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usageRatioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {usageRatioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4CAF50' : '#FF5722'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Field Types</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fieldTypeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {fieldTypeChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Analysis Tabs */}
        <Tabs 
          defaultValue="unused" 
          className="w-full" 
          value={activeTab} 
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
            <TabsTrigger value="unused">Unused Fields</TabsTrigger>
            <TabsTrigger value="filtered">Most Filtered</TabsTrigger>
            <TabsTrigger value="naming">Naming Issues</TabsTrigger>
            <TabsTrigger value="labels">Long Labels</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unused" className="space-y-4">
            {unusedFields.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>No unused fields found</AlertTitle>
                <AlertDescription>
                  All fields in the selected objects are being used!
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex justify-between mb-2">
                  <div className="text-sm font-medium">
                    {unusedFields.length} unused fields found
                  </div>
                  <Button variant="outline" size="sm">
                    <Archive className="mr-2 h-4 w-4" />
                    Create Cleanup Plan
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-neutral-50">
                        <th className="text-left p-2 border border-neutral-200">Field</th>
                        <th className="text-left p-2 border border-neutral-200">Object</th>
                        <th className="text-left p-2 border border-neutral-200">Type</th>
                        <th className="text-left p-2 border border-neutral-200">Custom</th>
                        <th className="text-left p-2 border border-neutral-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unusedFields.map((field, index) => (
                        <tr key={index} className="border-t border-neutral-200 hover:bg-neutral-50">
                          <td className="p-2 border border-neutral-200">{field.name}</td>
                          <td className="p-2 border border-neutral-200">{field.object}</td>
                          <td className="p-2 border border-neutral-200">{field.type}</td>
                          <td className="p-2 border border-neutral-200">
                            {field.isCustom ? (
                              <Badge variant="default">Custom</Badge>
                            ) : (
                              <Badge variant="outline">Standard</Badge>
                            )}
                          </td>
                          <td className="p-2 border border-neutral-200">
                            <Button variant="ghost" size="sm">Analyze</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="filtered" className="space-y-4">
            {mostFilteredFields.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No filter data available</AlertTitle>
                <AlertDescription>
                  We don't have enough data to analyze filter usage.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="text-sm font-medium mb-4">
                  Most frequently used fields in queries and filters
                </div>
                
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mostFilteredFields.map(f => ({
                        name: f.name,
                        object: f.object,
                        count: f.usageCount
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="text-xs text-neutral-500 mt-2">
                  This data shows fields most frequently used in WHERE clauses, filters, and reports.
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="naming" className="space-y-4">
            {inconsistentNaming.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>No naming inconsistencies found</AlertTitle>
                <AlertDescription>
                  All field names follow a consistent pattern.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex justify-between mb-2">
                  <div className="text-sm font-medium">
                    {inconsistentNaming.length} naming inconsistencies found
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Rename Script
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-neutral-50">
                        <th className="text-left p-2 border border-neutral-200">Current Name</th>
                        <th className="text-left p-2 border border-neutral-200">Suggested Name</th>
                        <th className="text-left p-2 border border-neutral-200">Objects</th>
                        <th className="text-left p-2 border border-neutral-200">Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inconsistentNaming.map((insight, index) => (
                        <tr key={index} className="border-t border-neutral-200 hover:bg-neutral-50">
                          <td className="p-2 border border-neutral-200">{insight.inconsistentName}</td>
                          <td className="p-2 border border-neutral-200">{insight.suggestedName}</td>
                          <td className="p-2 border border-neutral-200">
                            <div className="flex flex-wrap gap-1">
                              {insight.objects.map((obj, i) => (
                                <Badge key={i} variant="outline">{obj}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-2 border border-neutral-200">
                            <Badge 
                              variant={
                                insight.impact === 'high' ? 'destructive' : 
                                insight.impact === 'medium' ? 'default' : 'outline'
                              }
                            >
                              {insight.impact}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="labels" className="space-y-4">
            {longLabelFields.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>No issues with long labels or tooltips</AlertTitle>
                <AlertDescription>
                  All field labels and tooltips have reasonable lengths.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="text-sm font-medium mb-4">
                  Fields with excessively long labels or tooltips
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-neutral-50">
                        <th className="text-left p-2 border border-neutral-200">Field</th>
                        <th className="text-left p-2 border border-neutral-200">Object</th>
                        <th className="text-left p-2 border border-neutral-200">Label Length</th>
                        <th className="text-left p-2 border border-neutral-200">Tooltip Length</th>
                        <th className="text-left p-2 border border-neutral-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {longLabelFields.map((field, index) => (
                        <tr key={index} className="border-t border-neutral-200 hover:bg-neutral-50">
                          <td className="p-2 border border-neutral-200">{field.fieldName}</td>
                          <td className="p-2 border border-neutral-200">{field.object}</td>
                          <td className="p-2 border border-neutral-200">
                            <Badge variant={field.labelLength > 50 ? 'destructive' : 'default'}>
                              {field.labelLength} chars
                            </Badge>
                          </td>
                          <td className="p-2 border border-neutral-200">
                            {field.tooltipLength ? (
                              <Badge variant={field.tooltipLength > 100 ? 'destructive' : 'default'}>
                                {field.tooltipLength} chars
                              </Badge>
                            ) : (
                              <span className="text-neutral-400">None</span>
                            )}
                          </td>
                          <td className="p-2 border border-neutral-200">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="text-xs text-neutral-500 mt-2">
                  Long labels and tooltips can cause UI issues and poor user experience. 
                  Consider shortening them for better readability.
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        
        {/* CTA section */}
        <div className="mt-6">
          <Button variant="default" className="w-full sm:w-auto">
            Launch Field Cleanup Wizard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}