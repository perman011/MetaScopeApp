import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Code, 
  FileCode, 
  Info,
  AlertCircle
} from "lucide-react";

// Define TypeScript interfaces for the component
interface CodeQualityProps {
  orgId: number;
}

interface ComponentQuality {
  id: number;
  orgId: number;
  componentId: number;
  componentName: string;
  componentType: string;
  qualityScore: number;
  complexityScore: number;
  testCoverage: number;
  bestPracticesScore: number;
  securityScore: number;
  performanceScore: number;
  issuesCount: number;
  issues: CodeQualityIssue[];
  complexityMetrics: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    linesOfCode: number;
    commentRatio: number;
    methodCount: number;
    averageMethodLength: number;
    nestingDepth: number;
    duplicatedCode: number;
  };
  createdAt: string;
}

interface CodeQualityIssue {
  id: string;
  line: number;
  column: number;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  description: string;
  recommendation: string;
  codeSnippet?: string;
}

const CodeQualityOverview: React.FC<CodeQualityProps> = ({ orgId }) => {
  const [selectedComponentType, setSelectedComponentType] = useState<string | undefined>(undefined);
  
  const { data: codeQualityData, isLoading, error } = useQuery<ComponentQuality[]>({
    queryKey: ['/api/orgs', orgId, 'code-quality', selectedComponentType],
    queryFn: async () => {
      const url = selectedComponentType 
        ? `/api/orgs/${orgId}/code-quality?componentType=${selectedComponentType}`
        : `/api/orgs/${orgId}/code-quality`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch code quality data');
      }
      return response.json();
    },
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Code Quality</CardTitle>
          <CardDescription>Loading code quality analysis...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Code Quality</CardTitle>
          <CardDescription>Analysis of your Salesforce components' code quality</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load code quality data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!codeQualityData || codeQualityData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Code Quality</CardTitle>
          <CardDescription>Analysis of your Salesforce components' code quality</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription>
              No code quality data is currently available for this org.
              Connect to your Salesforce org to analyze code quality.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Calculate average scores
  const averageQualityScore = codeQualityData.reduce((sum, item) => sum + item.qualityScore, 0) / codeQualityData.length;
  const averageTestCoverage = codeQualityData.reduce((sum, item) => sum + item.testCoverage, 0) / codeQualityData.length;
  const totalIssues = codeQualityData.reduce((sum, item) => sum + item.issuesCount, 0);
  
  // Count issues by severity
  const issuesBySeverity = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  codeQualityData.forEach(component => {
    component.issues?.forEach(issue => {
      issuesBySeverity[issue.severity]++;
    });
  });

  // Group components by type
  const componentTypes = [...new Set(codeQualityData.map(item => item.componentType))];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Code Quality</CardTitle>
        <CardDescription>Analysis of your Salesforce components' code quality</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* Overview Section */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Overall Quality Score</div>
              <div className="flex items-center">
                <Progress value={averageQualityScore} className="h-2 flex-1" />
                <span className="ml-2 text-sm font-medium">{averageQualityScore.toFixed(1)}%</span>
              </div>
              <QualityIndicator score={averageQualityScore} />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Test Coverage</div>
              <div className="flex items-center">
                <Progress value={averageTestCoverage} className="h-2 flex-1" />
                <span className="ml-2 text-sm font-medium">{averageTestCoverage.toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Total Issues</div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-destructive mr-1" />
                  <span>{totalIssues}</span>
                </div>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-warning mr-1" />
                  <span>{issuesBySeverity.critical + issuesBySeverity.high}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Component Type Filter */}
          <div className="flex flex-wrap gap-2 my-4">
            <Badge 
              className={`cursor-pointer ${!selectedComponentType ? 'bg-primary' : 'bg-secondary'}`}
              onClick={() => setSelectedComponentType(undefined)}
            >
              All Types
            </Badge>
            
            {componentTypes.map((type) => (
              <Badge 
                key={type}
                className={`cursor-pointer ${selectedComponentType === type ? 'bg-primary' : 'bg-secondary'}`}
                onClick={() => setSelectedComponentType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
          
          {/* Components List */}
          <Tabs defaultValue="components" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="metrics">Complexity Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="components" className="space-y-4">
              {codeQualityData.map((component) => (
                <ComponentQualityCard key={component.id} component={component} />
              ))}
            </TabsContent>
            
            <TabsContent value="issues" className="space-y-4">
              {codeQualityData.flatMap((component) => 
                component.issues?.map((issue) => (
                  <IssueCard 
                    key={`${component.id}-${issue.id}`} 
                    issue={issue} 
                    componentName={component.componentName}
                  />
                )) || []
              )}
            </TabsContent>
            
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {codeQualityData.map((component) => (
                  <ComplexityMetricsCard 
                    key={component.id} 
                    componentName={component.componentName} 
                    metrics={component.complexityMetrics} 
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper components
const QualityIndicator: React.FC<{ score: number }> = ({ score }) => {
  if (score >= 85) {
    return (
      <div className="flex items-center text-green-600">
        <CheckCircle className="h-4 w-4 mr-1" />
        <span className="text-xs">Excellent</span>
      </div>
    );
  } else if (score >= 70) {
    return (
      <div className="flex items-center text-yellow-600">
        <CheckCircle className="h-4 w-4 mr-1" />
        <span className="text-xs">Good</span>
      </div>
    );
  } else if (score >= 50) {
    return (
      <div className="flex items-center text-orange-500">
        <AlertTriangle className="h-4 w-4 mr-1" />
        <span className="text-xs">Needs Improvement</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-red-600">
        <XCircle className="h-4 w-4 mr-1" />
        <span className="text-xs">Poor</span>
      </div>
    );
  }
};

const ComponentQualityCard: React.FC<{ component: ComponentQuality }> = ({ component }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-sm flex items-center">
              {component.componentType === "ApexClass" ? (
                <Code className="h-4 w-4 mr-1" />
              ) : (
                <FileCode className="h-4 w-4 mr-1" />
              )}
              {component.componentName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{component.componentType}</p>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">{component.qualityScore.toFixed(1)}%</span>
            <QualityIndicator score={component.qualityScore} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Test Coverage</p>
            <Progress value={component.testCoverage} className="h-1" />
            <p className="text-xs font-medium">{component.testCoverage.toFixed(1)}%</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Issues</p>
            <div className="flex items-center">
              <Badge variant={component.issuesCount > 0 ? "destructive" : "outline"} className="text-xs">
                {component.issuesCount}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const IssueCard: React.FC<{ issue: CodeQualityIssue; componentName: string }> = ({ issue, componentName }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'low':
        return <Info className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              {getSeverityIcon(issue.severity)}
              <h3 className="font-medium text-sm ml-2">{issue.message}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {componentName} (Line {issue.line}, Column {issue.column})
            </p>
          </div>
          
          <Badge className={`text-xs ${getSeverityClass(issue.severity)}`}>
            {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
          </Badge>
        </div>
        
        {issue.codeSnippet && (
          <div className="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap">
            {issue.codeSnippet}
          </div>
        )}
        
        <div className="mt-2 text-xs">
          <p className="font-medium">Rule: {issue.rule}</p>
          <p className="mt-1">{issue.description}</p>
          
          {issue.recommendation && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900 rounded">
              <p className="font-medium">Recommendation:</p>
              <p>{issue.recommendation}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ComplexityMetricsCard: React.FC<{ 
  componentName: string; 
  metrics: ComponentQuality['complexityMetrics'];
}> = ({ componentName, metrics }) => {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">{componentName}</CardTitle>
        <CardDescription>Complexity Analysis</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Cyclomatic Complexity</p>
            <p className="text-sm font-medium">{metrics.cyclomaticComplexity}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cognitive Complexity</p>
            <p className="text-sm font-medium">{metrics.cognitiveComplexity}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lines of Code</p>
            <p className="text-sm font-medium">{metrics.linesOfCode}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Comment Ratio</p>
            <p className="text-sm font-medium">{metrics.commentRatio.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Method Count</p>
            <p className="text-sm font-medium">{metrics.methodCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Method Length</p>
            <p className="text-sm font-medium">{metrics.averageMethodLength.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nesting Depth</p>
            <p className="text-sm font-medium">{metrics.nestingDepth}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duplicated Code</p>
            <p className="text-sm font-medium">{metrics.duplicatedCode.toFixed(1)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeQualityOverview;