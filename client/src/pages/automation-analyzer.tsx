import { useOrgContext } from "@/hooks/use-org";
import { useEffect, useState } from "react";
import { Loader2, Layers, AlertCircle, Check, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types for automation data
interface AutomationData {
  flows: Flow[];
  processBuilders: ProcessBuilder[];
  workflowRules: WorkflowRule[];
  apexTriggers: ApexTrigger[];
  conflicts: Conflict[];
  recommendations: Recommendation[];
}

interface Flow {
  id: string;
  name: string;
  status: string;
  modified: string;
  type: string;
  description: string;
}

interface ProcessBuilder {
  id: string;
  name: string;
  status: string;
  modified: string;
  object: string;
  description: string;
}

interface WorkflowRule {
  id: string;
  name: string;
  status: string;
  modified: string;
  object: string;
  description: string;
}

interface ApexTrigger {
  id: string;
  name: string;
  object: string;
  modified: string;
  events: string;
  description: string;
}

interface Conflict {
  id: number;
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  components: string[];
  description: string;
}

interface Recommendation {
  id: number;
  type: string;
  impact: 'High' | 'Medium' | 'Low';
  description: string;
}

interface AutomationTypeCardProps {
  title: string;
  count: number;
  icon: React.ElementType;
  className?: string;
}

function AutomationTypeCard({ title, count, icon: Icon, className = "" }: AutomationTypeCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Icon className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{count}</div>
      </CardContent>
    </Card>
  );
}

interface ConflictSeverityBadgeProps {
  severity: 'High' | 'Medium' | 'Low';
}

function ConflictSeverityBadge({ severity }: ConflictSeverityBadgeProps) {
  const severityMap = {
    High: "bg-red-100 text-red-800 hover:bg-red-100",
    Medium: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    Low: "bg-green-100 text-green-800 hover:bg-green-100"
  };

  return (
    <Badge variant="outline" className={severityMap[severity] || ""}>
      {severity}
    </Badge>
  );
}

interface RecommendationImpactBadgeProps {
  impact: 'High' | 'Medium' | 'Low';
}

function RecommendationImpactBadge({ impact }: RecommendationImpactBadgeProps) {
  const impactMap = {
    High: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    Medium: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    Low: "bg-slate-100 text-slate-800 hover:bg-slate-100"
  };

  return (
    <Badge variant="outline" className={impactMap[impact] || ""}>
      {impact}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Active") {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
        Active
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
        {status}
      </Badge>
    );
  }
}

export default function AutomationAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const { activeOrg } = useOrgContext();

  // Query metadata for active org
  const { data: metadata, isLoading: isMetadataLoading, refetch: refetchMetadata } = useQuery<any[]>({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata`],
    enabled: !!activeOrg && analysisComplete,
  });

  // Query automation data for active org (flows, process builders, etc.)
  const { data: automationData, isLoading: isAutomationLoading, refetch: refetchAutomationData } = useQuery<AutomationData>({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata/automations`],
    enabled: !!activeOrg && analysisComplete,
    // Transform the raw metadata into our expected automation data format
    select: (rawData: any) => {
      // Default empty automation data structure
      const defaultData: AutomationData = {
        flows: [],
        processBuilders: [],
        workflowRules: [],
        apexTriggers: [],
        conflicts: [],
        recommendations: []
      };
      
      try {
        if (!rawData) return defaultData;

        // Extract flows from metadata
        const flows = rawData
          .filter((item: any) => item.type === 'Flow')
          .map((flow: any) => ({
            id: flow.id || flow.name,
            name: flow.name,
            status: flow.active ? 'Active' : 'Inactive',
            modified: flow.lastModifiedDate || new Date().toISOString().split('T')[0],
            type: flow.processType || 'Flow',
            description: flow.description || `Flow for ${flow.name}`
          }));

        // Extract process builders from metadata
        const processBuilders = rawData
          .filter((item: any) => item.type === 'ProcessBuilder')
          .map((process: any) => ({
            id: process.id || process.name,
            name: process.name,
            status: process.active ? 'Active' : 'Inactive',
            modified: process.lastModifiedDate || new Date().toISOString().split('T')[0],
            object: process.objectType || 'Unknown',
            description: process.description || `Process Builder for ${process.name}`
          }));

        // Extract workflow rules from metadata
        const workflowRules = rawData
          .filter((item: any) => item.type === 'WorkflowRule')
          .map((rule: any) => ({
            id: rule.id || rule.name,
            name: rule.name,
            status: rule.active ? 'Active' : 'Inactive',
            modified: rule.lastModifiedDate || new Date().toISOString().split('T')[0],
            object: rule.objectType || 'Unknown',
            description: rule.description || `Workflow Rule for ${rule.name}`
          }));

        // Extract apex triggers from metadata
        const apexTriggers = rawData
          .filter((item: any) => item.type === 'ApexTrigger')
          .map((trigger: any) => ({
            id: trigger.id || trigger.name,
            name: trigger.name,
            object: trigger.entityDefinition || 'Unknown',
            modified: trigger.lastModifiedDate || new Date().toISOString().split('T')[0],
            events: trigger.events || 'Before/After',
            description: trigger.description || `Apex Trigger for ${trigger.name}`
          }));

        // Analyze for conflicts and generate recommendations
        // This would be more sophisticated in a real implementation
        const conflicts: Conflict[] = [];
        const recommendations: Recommendation[] = [];

        // Simple conflict detection example: 
        // If multiple automations act on the same object
        const objectAutomationCount = new Map<string, string[]>();
        
        // Count automations per object
        [...workflowRules, ...processBuilders].forEach((item: WorkflowRule | ProcessBuilder) => {
          if (!objectAutomationCount.has(item.object)) {
            objectAutomationCount.set(item.object, []);
          }
          objectAutomationCount.get(item.object)?.push(item.name);
        });
        
        // Check for objects with multiple automations
        let conflictId = 1;
        objectAutomationCount.forEach((automations, objectName) => {
          if (automations.length > 1) {
            conflicts.push({
              id: conflictId++,
              type: "Multiple Automations",
              severity: "Medium",
              components: automations,
              description: `Multiple automations act on the ${objectName} object which could cause conflicts.`
            });
          }
        });

        // Generate recommendations based on findings
        let recId = 1;
        if (workflowRules.length > 0) {
          recommendations.push({
            id: recId++,
            type: "Migration",
            impact: "Medium",
            description: "Convert workflow rules to flow for better maintainability and future compatibility."
          });
        }

        if (conflicts.length > 0) {
          recommendations.push({
            id: recId++,
            type: "Refactoring",
            impact: "High",
            description: "Consolidate redundant automations to reduce complexity and improve maintainability."
          });
        }

        return {
          flows,
          processBuilders,
          workflowRules,
          apexTriggers,
          conflicts,
          recommendations
        };
      } catch (error) {
        console.error("Error transforming automation data:", error);
        return defaultData;
      }
    }
  });

  // Sync metadata if needed
  const syncMetadata = async () => {
    if (!activeOrg) return;
    
    setIsAnalyzing(true);
    
    try {
      // First sync/fetch metadata
      await apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {
        types: ["Flow", "ApexTrigger", "WorkflowRule", "ProcessBuilder"]
      });
      
      // Refetch metadata and automation data
      await refetchMetadata();
      await refetchAutomationData();
      
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    } catch (error) {
      console.error("Error during automation analysis:", error);
      setIsAnalyzing(false);
    }
  };

  // Start the analysis process
  const startAnalysis = () => {
    syncMetadata();
  };

  // Reset if org changes
  useEffect(() => {
    setAnalysisComplete(false);
  }, [activeOrg]);
  
  // Get automation data, falling back to empty arrays when needed
  const automationDataWithDefaults: AutomationData = {
    flows: automationData?.flows || [],
    processBuilders: automationData?.processBuilders || [],
    workflowRules: automationData?.workflowRules || [],
    apexTriggers: automationData?.apexTriggers || [],
    conflicts: automationData?.conflicts || [],
    recommendations: automationData?.recommendations || []
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">Automation Analyzer</h1>
            <p className="text-neutral-600">
              Analyze Process Builders, Flows, Workflow Rules, and Apex Triggers across your org.
            </p>
          </div>
          <div>
            <Button
              onClick={startAnalysis}
              disabled={isAnalyzing || !activeOrg}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Layers className="mr-2 h-4 w-4" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </div>

        {!activeOrg && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No org selected</AlertTitle>
            <AlertDescription>
              Please select a Salesforce org to analyze automations.
            </AlertDescription>
          </Alert>
        )}

        {analysisComplete && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <AutomationTypeCard
                title="Flows"
                count={automationDataWithDefaults.flows.length}
                icon={Layers}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
              />
              <AutomationTypeCard
                title="Process Builders"
                count={automationDataWithDefaults.processBuilders.length}
                icon={Layers}
                className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
              />
              <AutomationTypeCard
                title="Workflow Rules"
                count={automationDataWithDefaults.workflowRules.length}
                icon={Layers}
                className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
              />
              <AutomationTypeCard
                title="Apex Triggers"
                count={automationDataWithDefaults.apexTriggers.length}
                icon={Layers}
                className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
              />
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Potential Conflicts</CardTitle>
                <CardDescription>
                  The analysis identified {automationDataWithDefaults.conflicts.length} potential conflicts in your automation setup.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Components</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automationDataWithDefaults.conflicts.map((conflict: Conflict) => (
                      <TableRow key={conflict.id}>
                        <TableCell className="font-medium">{conflict.type}</TableCell>
                        <TableCell>
                          <ConflictSeverityBadge severity={conflict.severity} />
                        </TableCell>
                        <TableCell>{conflict.components.join(", ")}</TableCell>
                        <TableCell>{conflict.description}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Tabs defaultValue="flows" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="flows">Flows</TabsTrigger>
                <TabsTrigger value="process-builders">Process Builders</TabsTrigger>
                <TabsTrigger value="workflow-rules">Workflow Rules</TabsTrigger>
                <TabsTrigger value="apex-triggers">Apex Triggers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="flows">
                <Card>
                  <CardHeader>
                    <CardTitle>Flows</CardTitle>
                    <CardDescription>
                      List of all Flow automations in your org
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Modified</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {automationDataWithDefaults.flows.map((flow: Flow) => (
                          <TableRow key={flow.id}>
                            <TableCell className="font-medium">{flow.name}</TableCell>
                            <TableCell>{flow.type}</TableCell>
                            <TableCell>
                              <StatusBadge status={flow.status} />
                            </TableCell>
                            <TableCell>{flow.modified}</TableCell>
                            <TableCell>{flow.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="process-builders">
                <Card>
                  <CardHeader>
                    <CardTitle>Process Builders</CardTitle>
                    <CardDescription>
                      List of all Process Builder automations in your org
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Object</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Modified</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {automationDataWithDefaults.processBuilders.map((process: ProcessBuilder) => (
                          <TableRow key={process.id}>
                            <TableCell className="font-medium">{process.name}</TableCell>
                            <TableCell>{process.object}</TableCell>
                            <TableCell>
                              <StatusBadge status={process.status} />
                            </TableCell>
                            <TableCell>{process.modified}</TableCell>
                            <TableCell>{process.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="workflow-rules">
                <Card>
                  <CardHeader>
                    <CardTitle>Workflow Rules</CardTitle>
                    <CardDescription>
                      List of all Workflow Rules in your org
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Object</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Modified</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {automationDataWithDefaults.workflowRules.map((rule: WorkflowRule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.name}</TableCell>
                            <TableCell>{rule.object}</TableCell>
                            <TableCell>
                              <StatusBadge status={rule.status} />
                            </TableCell>
                            <TableCell>{rule.modified}</TableCell>
                            <TableCell>{rule.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="apex-triggers">
                <Card>
                  <CardHeader>
                    <CardTitle>Apex Triggers</CardTitle>
                    <CardDescription>
                      List of all Apex Triggers in your org
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Object</TableHead>
                          <TableHead>Events</TableHead>
                          <TableHead>Modified</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {automationDataWithDefaults.apexTriggers.map((trigger: ApexTrigger) => (
                          <TableRow key={trigger.id}>
                            <TableCell className="font-medium">{trigger.name}</TableCell>
                            <TableCell>{trigger.object}</TableCell>
                            <TableCell>{trigger.events}</TableCell>
                            <TableCell>{trigger.modified}</TableCell>
                            <TableCell>{trigger.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Based on our analysis, here are the recommendations to improve your automation setup.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automationDataWithDefaults.recommendations.map((rec: Recommendation) => (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium">{rec.type}</TableCell>
                        <TableCell>
                          <RecommendationImpactBadge impact={rec.impact} />
                        </TableCell>
                        <TableCell>{rec.description}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {!analysisComplete && !isAnalyzing && activeOrg && (
          <Card className="text-center p-6">
            <div className="mb-4">
              <Layers className="h-12 w-12 mx-auto text-primary-500" />
            </div>
            <h2 className="text-xl font-medium text-neutral-800 mb-2">Run Automation Analysis</h2>
            <p className="text-neutral-600 max-w-md mx-auto mb-4">
              Click the "Run Analysis" button to scan your Salesforce org for automations and detect potential conflicts.
            </p>
            <Button onClick={startAnalysis}>
              <Layers className="mr-2 h-4 w-4" />
              Run Analysis
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}