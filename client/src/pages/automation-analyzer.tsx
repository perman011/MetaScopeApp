import { useOrgContext } from "@/hooks/use-org";
import { useEffect, useState } from "react";
import { Loader2, Layers, AlertCircle, Check, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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


// Mock automation data since backend integration not implemented yet
const mockAutomationData = {
  flows: [
    { id: 1, name: "Lead Qualification Flow", status: "Active", modified: "2025-03-15", type: "Screen Flow", description: "Guides users through lead qualification process" },
    { id: 2, name: "Case Escalation Process", status: "Active", modified: "2025-03-12", type: "Record-Triggered Flow", description: "Automatically escalates high-priority cases" },
    { id: 3, name: "New Customer Onboarding", status: "Draft", modified: "2025-03-10", type: "Screen Flow", description: "Onboarding workflow for new customers" }
  ],
  processBuilders: [
    { id: 1, name: "Account Update Process", status: "Active", modified: "2025-03-14", object: "Account", description: "Updates related contacts when account changes" },
    { id: 2, name: "Opportunity Stage Change", status: "Active", modified: "2025-03-11", object: "Opportunity", description: "Triggers actions based on opportunity stage changes" }
  ],
  workflowRules: [
    { id: 1, name: "Send Welcome Email", status: "Active", object: "Contact", modified: "2025-03-13", description: "Sends welcome email to new contacts" },
    { id: 2, name: "Update Account Rating", status: "Inactive", object: "Account", modified: "2025-03-10", description: "Updates account rating based on activity" }
  ],
  apexTriggers: [
    { id: 1, name: "ContactTrigger", object: "Contact", modified: "2025-03-15", events: "Before Insert, After Insert", description: "Handles contact record validations and post-processing" },
    { id: 2, name: "OpportunityTrigger", object: "Opportunity", modified: "2025-03-12", events: "Before Update, After Update", description: "Maintains opportunity team members and sharing rules" }
  ],
  conflicts: [
    { id: 1, type: "Order of Execution", severity: "High" as const, components: ["ContactTrigger", "Contact Update Process"], description: "Multiple automations may cause recursive updates" },
    { id: 2, type: "Duplicate Logic", severity: "Medium" as const, components: ["Case Escalation Process", "Case Escalation Workflow"], description: "Similar logic implemented in multiple places" },
    { id: 3, type: "Performance", severity: "Low" as const, components: ["AccountTrigger"], description: "SOQL query inside a loop may cause governor limits issues" }
  ],
  recommendations: [
    { id: 1, type: "Refactoring", impact: "High" as const, description: "Consolidate Contact triggers and process builders into a single flow" },
    { id: 2, type: "Migration", impact: "Medium" as const, description: "Convert workflow rules to flow for better maintainability" },
    { id: 3, type: "Performance", impact: "Medium" as const, description: "Optimize SOQL queries in Apex triggers to avoid governor limits" }
  ]
};

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

  // Simulates analysis process
  const startAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 2000);
  };

  // Reset if org changes
  useEffect(() => {
    setAnalysisComplete(false);
  }, [activeOrg]);

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
                count={mockAutomationData.flows.length}
                icon={Layers}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
              />
              <AutomationTypeCard
                title="Process Builders"
                count={mockAutomationData.processBuilders.length}
                icon={Layers}
                className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
              />
              <AutomationTypeCard
                title="Workflow Rules"
                count={mockAutomationData.workflowRules.length}
                icon={Layers}
                className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
              />
              <AutomationTypeCard
                title="Apex Triggers"
                count={mockAutomationData.apexTriggers.length}
                icon={Layers}
                className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
              />
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Potential Conflicts</CardTitle>
                <CardDescription>
                  The analysis identified {mockAutomationData.conflicts.length} potential conflicts in your automation setup.
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
                    {mockAutomationData.conflicts.map((conflict) => (
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
                        {mockAutomationData.flows.map((flow) => (
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
                        {mockAutomationData.processBuilders.map((process) => (
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
                        {mockAutomationData.workflowRules.map((rule) => (
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
                        {mockAutomationData.apexTriggers.map((trigger) => (
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
                    {mockAutomationData.recommendations.map((rec) => (
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