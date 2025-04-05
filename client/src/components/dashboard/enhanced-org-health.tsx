import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Define custom Progress component with indicator className
const CustomProgress = ({ 
  value,
  className,
  indicatorClassName,
  ...props
}: { 
  value: number, 
  className?: string, 
  indicatorClassName?: string 
} & React.ComponentProps<typeof Progress>) => {
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-neutral-200 ${className || "h-2"}`}>
      <div 
        className={`h-full transition-all ${indicatorClassName || "bg-blue-500"}`}
        style={{ width: `${value}%` }}
        {...props}
      />
    </div>
  );
};
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Check, 
  AlertTriangle, 
  Info, 
  Shield, 
  Database, 
  Code, 
  Zap, 
  LineChart, 
  Server, 
  UserCheck, 
  HardDrive, 
  Gauge,
  ChevronRight,
  Bookmark,
  Clock
} from "lucide-react";
import { HealthScore, HealthScoreIssue } from "@shared/schema";
import { cn } from "@/lib/utils";

// Type for each action item
interface ActionItem {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effortRequired: "high" | "medium" | "low";
  category: "security" | "performance" | "maintenance" | "adoption" | "limits";
  timeEstimate: string;
  automated: boolean;
}

// Extended health metrics
interface ExtendedHealthMetrics {
  // Salesforce Optimizer metrics
  profilesCount: number;
  permissionSetsCount: number;
  duplicateRulesCount: number;
  validationRulesCount: number;
  unassignedPermissionSets: number;
  
  // Lightning Experience metrics
  lightningAdoptionRate: number;
  classicUsersCount: number;
  lightningCompatibilityScore: number;
  
  // Governor Limits
  apiDailyRequestsUsage: number;
  apexHeapUsage: number;
  soqlQueriesAvgTime: number;
  dmlStatementsCount: number;
  
  // Storage metrics
  dataStorageUsed: number;
  dataStorageLimit: number;
  fileStorageUsed: number;
  fileStorageLimit: number;
  largestObjects: Array<{name: string, size: number}>;
}

// Props for the enhanced health component
interface EnhancedOrgHealthProps {
  healthScore?: HealthScore;
  extendedMetrics?: ExtendedHealthMetrics;
  isLoading: boolean;
  onActionClick: (actionId: string) => void;
}

// Sample action items
const sampleActionItems: ActionItem[] = [
  {
    id: "action-1",
    title: "Update password policies to enforce stronger security",
    description: "Current password policy does not meet industry best practices. Update to require min. 12 characters with complexity rules.",
    impact: "high",
    effortRequired: "low",
    category: "security",
    timeEstimate: "15-30 minutes",
    automated: true
  },
  {
    id: "action-2",
    title: "Reduce SOQL queries in Opportunity trigger",
    description: "OpportunityTrigger.cls contains SOQL queries inside loops, causing potential governor limit exceptions.",
    impact: "high",
    effortRequired: "medium",
    category: "performance",
    timeEstimate: "1-2 hours",
    automated: false
  },
  {
    id: "action-3",
    title: "Clean up unused custom fields",
    description: "37 custom fields across 12 objects haven't been accessed in over 6 months.",
    impact: "medium",
    effortRequired: "medium",
    category: "maintenance",
    timeEstimate: "2-3 hours",
    automated: true
  },
  {
    id: "action-4",
    title: "Complete Lightning transition for Sales team",
    description: "8 users in the Sales department are still using Salesforce Classic.",
    impact: "medium",
    effortRequired: "low",
    category: "adoption",
    timeEstimate: "1 hour",
    automated: false
  },
  {
    id: "action-5",
    title: "Optimize data storage for Account object",
    description: "Account object consumes 35% of your data storage. Implement archiving strategy.",
    impact: "medium",
    effortRequired: "high",
    category: "limits",
    timeEstimate: "4-8 hours",
    automated: false
  }
];

// Sample extended metrics
const defaultExtendedMetrics: ExtendedHealthMetrics = {
  profilesCount: 24,
  permissionSetsCount: 42,
  duplicateRulesCount: 8,
  validationRulesCount: 31,
  unassignedPermissionSets: 12,
  
  lightningAdoptionRate: 87,
  classicUsersCount: 8,
  lightningCompatibilityScore: 92,
  
  apiDailyRequestsUsage: 42,
  apexHeapUsage: 28,
  soqlQueriesAvgTime: 320, // in ms
  dmlStatementsCount: 5243, // daily average
  
  dataStorageUsed: 2.4, // in GB
  dataStorageLimit: 10, // in GB
  fileStorageUsed: 4.8, // in GB
  fileStorageLimit: 20, // in GB
  largestObjects: [
    {name: "Account", size: 0.84},
    {name: "Contact", size: 0.56},
    {name: "Opportunity", size: 0.48}
  ]
};

export default function EnhancedOrgHealth({ 
  healthScore, 
  extendedMetrics = defaultExtendedMetrics, 
  isLoading,
  onActionClick
}: EnhancedOrgHealthProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="h-8 w-1/3 bg-neutral-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-4 bg-neutral-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Provide default values but maintain original data structure
  const data = healthScore || {
    overallScore: 0,
    securityScore: 0,
    dataModelScore: 0,
    automationScore: 0,
    apexScore: 0,
    uiComponentScore: 0,
    issues: []
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };
  
  const getScoreBackgroundColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };
  
  const getImpactBadge = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high":
        return <Badge variant="destructive">High Impact</Badge>;
      case "medium":
        return <Badge variant="default">Medium Impact</Badge>;
      case "low":
        return <Badge variant="outline">Low Impact</Badge>;
    }
  };
  
  const getEffortBadge = (effort: "high" | "medium" | "low") => {
    switch (effort) {
      case "high":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High Effort</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Medium Effort</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low Effort</Badge>;
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "security":
        return <Shield className="h-5 w-5 text-blue-500" />;
      case "performance":
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case "maintenance":
        return <HardDrive className="h-5 w-5 text-purple-500" />;
      case "adoption":
        return <UserCheck className="h-5 w-5 text-green-500" />;
      case "limits":
        return <Gauge className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-neutral-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Action Plan</TabsTrigger>
          <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overall Health Card */}
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Overall Org Health</h2>
                  <p className="text-neutral-500">Based on Salesforce best practices</p>
                </div>
                <div className="flex items-center justify-center rounded-full w-24 h-24 bg-neutral-100">
                  <span className={`text-3xl font-bold ${getScoreColor(data?.overallScore || 0)}`}>
                    {data?.overallScore || 0}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Security</span>
                    <span className={getScoreColor(data?.securityScore || 0)}>{data?.securityScore || 0}/100</span>
                  </div>
                  <CustomProgress value={data?.securityScore || 0} className="h-2" indicatorClassName={getScoreBackgroundColor(data?.securityScore || 0)} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Data Model</span>
                    <span className={getScoreColor(data?.dataModelScore || 0)}>{data?.dataModelScore || 0}/100</span>
                  </div>
                  <CustomProgress value={data?.dataModelScore || 0} className="h-2" indicatorClassName={getScoreBackgroundColor(data?.dataModelScore || 0)} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Automation</span>
                    <span className={getScoreColor(data?.automationScore || 0)}>{data?.automationScore || 0}/100</span>
                  </div>
                  <CustomProgress value={data?.automationScore || 0} className="h-2" indicatorClassName={getScoreBackgroundColor(data?.automationScore || 0)} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Apex Code</span>
                    <span className={getScoreColor(data?.apexScore || 0)}>{data?.apexScore || 0}/100</span>
                  </div>
                  <CustomProgress value={data?.apexScore || 0} className="h-2" indicatorClassName={getScoreBackgroundColor(data?.apexScore || 0)} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Lightning Adoption</span>
                    <span className={getScoreColor(extendedMetrics?.lightningAdoptionRate || 0)}>{extendedMetrics?.lightningAdoptionRate || 0}%</span>
                  </div>
                  <CustomProgress value={extendedMetrics?.lightningAdoptionRate || 0} className="h-2" indicatorClassName={getScoreBackgroundColor(extendedMetrics?.lightningAdoptionRate || 0)} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Storage Utilization</span>
                    <span className={getScoreColor(100 - ((extendedMetrics?.dataStorageUsed || 0) / (extendedMetrics?.dataStorageLimit || 1) * 100))}>
                      {Math.round((extendedMetrics?.dataStorageUsed || 0) / (extendedMetrics?.dataStorageLimit || 1) * 100)}%
                    </span>
                  </div>
                  <CustomProgress 
                    value={Math.round((extendedMetrics?.dataStorageUsed || 0) / (extendedMetrics?.dataStorageLimit || 1) * 100)} 
                    className="h-2" 
                    indicatorClassName={getScoreBackgroundColor(100 - ((extendedMetrics?.dataStorageUsed || 0) / (extendedMetrics?.dataStorageLimit || 1) * 100))} 
                  />
                </div>
              </div>
              
              {/* Critical alerts section */}
              {data.issues && data.issues.length > 0 ? (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Critical Issues Detected</AlertTitle>
                  <AlertDescription>
                    {data.issues.filter(issue => issue.severity === 'critical').length} critical issues require your attention.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-green-50 border-green-200 text-green-800 mt-4">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">No Critical Issues</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your org is following Salesforce recommended best practices.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("details")}>
                View Detailed Metrics
              </Button>
              <Button onClick={() => setActiveTab("recommendations")}>
                See Action Plan
              </Button>
            </CardFooter>
          </Card>
          
          {/* Salesforce Optimizer Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span>Salesforce Optimizer Insights</span>
              </CardTitle>
              <CardDescription>
                Key metrics and recommendations from Salesforce Optimizer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border rounded p-3">
                  <div className="text-sm text-neutral-500">Profiles</div>
                  <div className="text-lg font-semibold">{extendedMetrics?.profilesCount || 0}</div>
                  {(extendedMetrics?.profilesCount || 0) > 20 && (
                    <div className="text-xs text-amber-600 flex items-center mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Consider consolidating profiles
                    </div>
                  )}
                </div>
                
                <div className="border rounded p-3">
                  <div className="text-sm text-neutral-500">Permission Sets</div>
                  <div className="text-lg font-semibold">{extendedMetrics?.permissionSetsCount || 0}</div>
                  {(extendedMetrics?.unassignedPermissionSets || 0) > 0 && (
                    <div className="text-xs text-amber-600 flex items-center mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {extendedMetrics?.unassignedPermissionSets || 0} unassigned
                    </div>
                  )}
                </div>
                
                <div className="border rounded p-3">
                  <div className="text-sm text-neutral-500">Validation Rules</div>
                  <div className="text-lg font-semibold">{extendedMetrics?.validationRulesCount || 0}</div>
                </div>
                
                <div className="border rounded p-3">
                  <div className="text-sm text-neutral-500">Duplicate Rules</div>
                  <div className="text-lg font-semibold">{extendedMetrics?.duplicateRulesCount || 0}</div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded p-4 text-blue-800 text-sm">
                <div className="font-medium mb-1">Optimizer Recommendation</div>
                <p>Run the Salesforce Optimizer report monthly to track changes and identify new improvement opportunities.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Governor Limits Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gauge className="h-5 w-5 text-red-500" />
                <span>Governor Limits Status</span>
              </CardTitle>
              <CardDescription>
                Current usage of key Salesforce governor limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">API Daily Request Limits</span>
                    <span className="font-medium">{extendedMetrics?.apiDailyRequestsUsage || 0}%</span>
                  </div>
                  <CustomProgress 
                    value={extendedMetrics?.apiDailyRequestsUsage || 0} 
                    className="h-2"
                    indicatorClassName={cn({
                      "bg-green-500": (extendedMetrics?.apiDailyRequestsUsage || 0) < 50,
                      "bg-amber-500": (extendedMetrics?.apiDailyRequestsUsage || 0) >= 50 && (extendedMetrics?.apiDailyRequestsUsage || 0) < 80,
                      "bg-red-500": (extendedMetrics?.apiDailyRequestsUsage || 0) >= 80
                    })}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">Apex Heap Usage</span>
                    <span className="font-medium">{extendedMetrics?.apexHeapUsage || 0}%</span>
                  </div>
                  <CustomProgress 
                    value={extendedMetrics?.apexHeapUsage || 0} 
                    className="h-2"
                    indicatorClassName={cn({
                      "bg-green-500": (extendedMetrics?.apexHeapUsage || 0) < 50,
                      "bg-amber-500": (extendedMetrics?.apexHeapUsage || 0) >= 50 && (extendedMetrics?.apexHeapUsage || 0) < 80,
                      "bg-red-500": (extendedMetrics?.apexHeapUsage || 0) >= 80
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm p-2 border rounded">
                  <div>
                    <span className="block text-neutral-500">SOQL Query Average</span>
                    <span className="font-medium">{extendedMetrics?.soqlQueriesAvgTime || 0} ms</span>
                  </div>
                  <div>
                    <span className="block text-neutral-500">DML Statements (Daily)</span>
                    <span className="font-medium">{(extendedMetrics?.dmlStatementsCount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Action Plan Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Your Personalized Action Plan</CardTitle>
              <CardDescription>
                Recommended actions to improve your Salesforce org health, prioritized by impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleActionItems.map(item => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex items-center gap-4 mb-3">
                          {getCategoryIcon(item.category)}
                          <h3 className="font-medium">{item.title}</h3>
                        </div>
                        <p className="text-neutral-600 text-sm mb-3">{item.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {getImpactBadge(item.impact)}
                          {getEffortBadge(item.effortRequired)}
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.timeEstimate}
                          </Badge>
                          {item.automated && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                              Automated Fix Available
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-neutral-50 p-3 border-t flex justify-end">
                        <Button 
                          size="sm" 
                          onClick={() => onActionClick(item.id)} 
                          variant={item.automated ? "default" : "outline"}
                        >
                          {item.automated ? "Auto-Fix Now" : "View Details"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" className="flex items-center gap-2" size="sm">
                <Bookmark className="h-4 w-4" />
                Save As PDF
              </Button>
              <Button variant="outline" className="flex items-center gap-2" size="sm">
                Export Action Plan
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Detailed Metrics Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Health Metrics</CardTitle>
              <CardDescription>
                Comprehensive analysis of your Salesforce org health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="security">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <span>Security & Access Controls</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm text-neutral-500">Password Policy Strength</div>
                          <CustomProgress value={data.securityScore} className="h-2" />
                          <div className="text-xs">{data.securityScore}/100</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-sm text-neutral-500">Field-Level Security</div>
                          <CustomProgress value={85} className="h-2" />
                          <div className="text-xs">85/100</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-sm text-neutral-500">Sharing Settings</div>
                          <CustomProgress value={92} className="h-2" />
                          <div className="text-xs">92/100</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-sm text-neutral-500">Session Settings</div>
                          <CustomProgress value={78} className="h-2" />
                          <div className="text-xs">78/100</div>
                        </div>
                      </div>
                      
                      <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">Recommendation</AlertTitle>
                        <AlertDescription className="text-amber-700">
                          Update your password policy to require a minimum of 10 characters with complexity rules.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="datamodel">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-green-500" />
                      <span>Data Model Analysis</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Custom Objects</div>
                          <div className="text-lg font-semibold">78</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Custom Fields</div>
                          <div className="text-lg font-semibold">1,243</div>
                          <div className="text-xs text-amber-600">37 unused for &gt;6 months</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Relationships</div>
                          <div className="text-lg font-semibold">156</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Record Types</div>
                          <div className="text-lg font-semibold">42</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-neutral-500">Schema Complexity Score</div>
                        <CustomProgress value={data.dataModelScore} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span>{data.dataModelScore}/100</span>
                          <span className="text-neutral-500">Lower is better</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="code">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-purple-500" />
                      <span>Apex Code Quality</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Apex Classes</div>
                          <div className="text-lg font-semibold">345</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Apex Triggers</div>
                          <div className="text-lg font-semibold">48</div>
                          <div className="text-xs text-red-600">5 with SOQL in loops</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Test Coverage</div>
                          <div className="text-lg font-semibold">84%</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Apex CPU Time</div>
                          <div className="text-lg font-semibold">28%</div>
                          <div className="text-xs text-green-600">of limit</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-neutral-500">Code Complexity</div>
                        <CustomProgress value={65} className="h-2" indicatorClassName="bg-amber-500" />
                        <div className="flex justify-between text-xs">
                          <span>65/100</span>
                          <span className="text-neutral-500">Needs improvement</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="automation">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      <span>Automation Analysis</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Workflow Rules</div>
                          <div className="text-lg font-semibold">87</div>
                          <div className="text-xs text-amber-600">Consider Flow migration</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Process Builders</div>
                          <div className="text-lg font-semibold">42</div>
                          <div className="text-xs text-amber-600">24 active</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Flows</div>
                          <div className="text-lg font-semibold">36</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Approval Processes</div>
                          <div className="text-lg font-semibold">12</div>
                        </div>
                      </div>
                      
                      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Flow Migration Opportunity</AlertTitle>
                        <AlertDescription className="text-blue-700">
                          Modernize your automation by converting Workflow Rules and Process Builders to Flow.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="storage">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-neutral-500" />
                      <span>Storage Analysis</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <h3 className="font-medium mb-2">Data Storage</h3>
                            <div className="relative pt-1">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <span className="text-xs font-semibold inline-block text-blue-600">
                                    {Math.round((extendedMetrics?.dataStorageUsed || 0) / (extendedMetrics?.dataStorageLimit || 1) * 100)}%
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-semibold inline-block text-neutral-600">
                                    {extendedMetrics?.dataStorageUsed || 0} GB / {extendedMetrics?.dataStorageLimit || 0} GB
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                                <div 
                                  style={{ width: `${((extendedMetrics?.dataStorageUsed || 0) / (extendedMetrics?.dataStorageLimit || 1)) * 100}%` }} 
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                ></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <h3 className="font-medium mb-2">File Storage</h3>
                            <div className="relative pt-1">
                              <div className="flex items-center justify-between mb-1">
                                <div>
                                  <span className="text-xs font-semibold inline-block text-green-600">
                                    {Math.round((extendedMetrics?.fileStorageUsed || 0) / (extendedMetrics?.fileStorageLimit || 1) * 100)}%
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-semibold inline-block text-neutral-600">
                                    {extendedMetrics?.fileStorageUsed || 0} GB / {extendedMetrics?.fileStorageLimit || 0} GB
                                  </span>
                                </div>
                              </div>
                              <div className="overflow-hidden h-2 text-xs flex rounded bg-green-200">
                                <div 
                                  style={{ width: `${((extendedMetrics?.fileStorageUsed || 0) / (extendedMetrics?.fileStorageLimit || 1)) * 100}%` }} 
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                                ></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-sm mb-2">Largest Objects by Storage</h3>
                        <div className="space-y-2">
                          {(extendedMetrics?.largestObjects || []).map((obj, i) => (
                            <div key={i} className="flex items-center justify-between text-sm p-2 border rounded">
                              <span>{obj.name}</span>
                              <span className="font-medium">{obj.size} GB</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="lightning">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-500" />
                      <span>Lightning Experience Adoption</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                          <span className="text-xl font-bold text-blue-700">{extendedMetrics?.lightningAdoptionRate || 0}%</span>
                        </div>
                        <div>
                          <h3 className="font-medium">Adoption Rate</h3>
                          <p className="text-sm text-neutral-500">
                            {extendedMetrics?.classicUsersCount || 0} users still on Salesforce Classic
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-neutral-500">Lightning Compatibility</div>
                        <CustomProgress value={extendedMetrics?.lightningCompatibilityScore || 0} className="h-2" />
                        <div className="text-xs">{extendedMetrics?.lightningCompatibilityScore || 0}/100</div>
                      </div>
                      
                      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Adoption Next Steps</AlertTitle>
                        <AlertDescription className="text-blue-700">
                          Review the remaining Classic users and create a transition plan to reach 100% Lightning Experience adoption.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}