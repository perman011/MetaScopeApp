import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SalesforceOrg } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useOrgContext } from "@/hooks/use-org";
import { useToast } from "@/hooks/use-toast";
import OrgContext from "@/components/org-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Zap, ZapOff, Settings, Send, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  Loader2,
  AlertCircle,
  Clock,
  Search,
  Flame,
  Database,
  Code,
  ChevronsUpDown,
  RefreshCw,
} from "lucide-react";

interface ApexLog {
  id: string;
  application: string;
  duration: number;
  location: string;
  logLength: number;
  operation: string;
  request: string;
  startTime: string;
  status: string;
  user: {
    id: string;
    name: string;
  };
}

interface ApexLogDetail {
  id: string;
  body: string;
  events: ApexLogEvent[];
  performance: {
    databaseTime: number;
    slowestQueries: SlowQuery[];
    apexExecutionTime: number;
    slowestMethods: SlowMethod[];
    heapUsage: number;
    limitUsage: LimitUsage[];
    totalExecutionTime: number;
  };
}

interface ApexLogEvent {
  type: string;
  timestamp: string;
  details: string;
  line: number;
  executionTime?: number;
  heapSize?: number;
  category: 'CODE_UNIT' | 'DML' | 'SOQL' | 'EXCEPTION' | 'CALLOUT' | 'VALIDATION' | 'SYSTEM';
  severity: 'INFO' | 'DEBUG' | 'WARNING' | 'ERROR';
}

interface SlowQuery {
  query: string;
  time: number;
  lineNumber: number;
  rows: number;
}

interface SlowMethod {
  className: string;
  methodName: string;
  time: number;
  lineNumber: number;
  called: number;
}

interface LimitUsage {
  name: string;
  used: number;
  total: number;
  percentage: number;
}

interface LogLevel {
  name: string;
  level: 'NONE' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'FINE' | 'FINER' | 'FINEST';
}

interface TraceFlag {
  id: string;
  debugLevelId: string;
  debugLevel: {
    id: string;
    developerName: string;
    apexCode: string;
    apexProfiling: string;
    callout: string;
    database: string;
    system: string;
    validation: string;
    visualforce: string;
    workflow: string;
  };
  expirationDate: string;
  logType: string;
  startDate: string;
  tracedEntityId: string;
  tracedEntityType: string;
}

const LOG_LEVEL_OPTIONS = [
  { name: 'None', level: 'NONE' as const },
  { name: 'Error', level: 'ERROR' as const },
  { name: 'Warn', level: 'WARN' as const },
  { name: 'Info', level: 'INFO' as const }, 
  { name: 'Debug', level: 'DEBUG' as const },
  { name: 'Fine', level: 'FINE' as const },
  { name: 'Finer', level: 'FINER' as const },
  { name: 'Finest', level: 'FINEST' as const }
];

const DEFAULT_DEBUG_LEVELS = {
  apexCode: 'DEBUG',
  apexProfiling: 'INFO',
  callout: 'INFO',
  database: 'INFO',
  system: 'DEBUG',
  validation: 'INFO',
  visualforce: 'INFO',
  workflow: 'INFO'
};

export default function ApexDebugAnalyzer() {
  const { activeOrg } = useOrgContext();
  const { toast } = useToast();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('logs');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [debugLevels, setDebugLevels] = useState<Record<string, string>>(DEFAULT_DEBUG_LEVELS);
  const [expiration, setExpiration] = useState<string>('30'); // Minutes
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [eventFilter, setEventFilter] = useState<Record<string, boolean>>({
    CODE_UNIT: true,
    DML: true,
    SOQL: true,
    EXCEPTION: true,
    CALLOUT: true,
    VALIDATION: true,
    SYSTEM: true,
  });
  const [severityFilter, setSeverityFilter] = useState<Record<string, boolean>>({
    INFO: true,
    DEBUG: true,
    WARNING: true,
    ERROR: true,
  });

  // Fetch users for trace flag selection
  const { data: users, isLoading: usersLoading } = useQuery<{ id: string; name: string }[]>({
    queryKey: [`/api/orgs/${activeOrg?.id}/users`],
    enabled: !!activeOrg && activeTab === 'traceFlags',
  });

  // Fetch Apex logs
  const { 
    data: logs,
    isLoading: logsLoading,
    refetch: refetchLogs
  } = useQuery<ApexLog[]>({
    queryKey: [`/api/orgs/${activeOrg?.id}/apex-logs`, searchQuery],
    enabled: !!activeOrg && activeTab === 'logs',
  });

  // Fetch log detail when a log is selected
  const {
    data: logDetail,
    isLoading: logDetailLoading
  } = useQuery<ApexLogDetail>({
    queryKey: [`/api/orgs/${activeOrg?.id}/apex-logs/${selectedLogId}`],
    enabled: !!activeOrg && !!selectedLogId,
  });

  // Fetch trace flags
  const {
    data: traceFlags,
    isLoading: traceFlagsLoading,
    refetch: refetchTraceFlags
  } = useQuery<TraceFlag[]>({
    queryKey: [`/api/orgs/${activeOrg?.id}/trace-flags`],
    enabled: !!activeOrg && activeTab === 'traceFlags',
  });

  // Create trace flag mutation
  const createTraceFlagMutation = useMutation({
    mutationFn: async (data: {
      tracedEntityId: string;
      debugLevelId?: string;
      debugLevel?: Record<string, string>;
      expirationMinutes: number;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/orgs/${activeOrg?.id}/trace-flags`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${activeOrg?.id}/trace-flags`] });
      toast({
        title: "Trace flag created",
        description: "The debug trace flag has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create trace flag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete trace flag mutation
  const deleteTraceFlagMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(
        "DELETE",
        `/api/orgs/${activeOrg?.id}/trace-flags/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${activeOrg?.id}/trace-flags`] });
      toast({
        title: "Trace flag deleted",
        description: "The debug trace flag has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete trace flag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete log mutation
  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(
        "DELETE",
        `/api/orgs/${activeOrg?.id}/apex-logs/${id}`
      );
    },
    onSuccess: () => {
      if (selectedLogId) setSelectedLogId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${activeOrg?.id}/apex-logs`] });
      toast({
        title: "Log deleted",
        description: "The Apex debug log has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete log",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter logs by search query
  const filteredLogs = logs
    ? logs.filter(
        (log) =>
          log.operation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.application.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Filter log events based on selected categories and severities
  const filteredEvents = logDetail?.events
    ? logDetail.events.filter(
        (event) => 
          eventFilter[event.category] && 
          severityFilter[event.severity]
      )
    : [];

  const handleCreateTraceFlag = () => {
    if (!selectedUserId) {
      toast({
        title: "User required",
        description: "Please select a user to trace.",
        variant: "destructive",
      });
      return;
    }

    createTraceFlagMutation.mutate({
      tracedEntityId: selectedUserId,
      debugLevel: debugLevels,
      expirationMinutes: parseInt(expiration, 10),
    });
  };

  const handleDeleteTraceFlag = (id: string) => {
    deleteTraceFlagMutation.mutate(id);
  };

  const handleDeleteLog = (id: string) => {
    if (id === selectedLogId) {
      setSelectedLogId(null);
    }
    deleteLogMutation.mutate(id);
  };

  const handleDebugLevelChange = (key: string, value: string) => {
    setDebugLevels((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleToggleEventFilter = (category: string) => {
    setEventFilter((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleToggleSeverityFilter = (severity: string) => {
    setSeverityFilter((prev) => ({
      ...prev,
      [severity]: !prev[severity],
    }));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="container mx-auto p-4 md:p-6 flex-1">
        <div className="max-w-7xl mx-auto">
          {activeOrg ? <OrgContext orgId={activeOrg.id} /> : null}

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">Apex Debug Analyzer</h1>
            <p className="text-neutral-500">
              Analyze Apex debug logs, manage trace flags, and identify performance bottlenecks.
            </p>
          </div>

          {!activeOrg ? (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Active Org</AlertTitle>
              <AlertDescription>
                Please select a Salesforce org from the dropdown in the top navigation bar.
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="logs">Debug Logs</TabsTrigger>
                <TabsTrigger value="traceFlags">Trace Flags</TabsTrigger>
                <TabsTrigger value="aiAssistant">AI Assistant</TabsTrigger>
              </TabsList>

              {/* Logs Tab */}
              <TabsContent value="logs" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Logs List */}
                    <div className="md:col-span-1 space-y-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle>Apex Debug Logs</CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refetchLogs()}
                              disabled={logsLoading}
                            >
                              {logsLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="relative mt-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search logs..."
                              className="pl-8"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="px-0">
                          {logsLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : filteredLogs.length > 0 ? (
                            <div className="max-h-[500px] overflow-y-auto">
                              <Table>
                                <TableBody>
                                  {filteredLogs.map((log) => (
                                    <TableRow
                                      key={log.id}
                                      className={`cursor-pointer ${
                                        selectedLogId === log.id ? "bg-primary-50" : ""
                                      }`}
                                      onClick={() => setSelectedLogId(log.id)}
                                    >
                                      <TableCell className="py-2">
                                        <div className="font-medium truncate max-w-[180px]">
                                          {log.operation}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {formatDuration(log.duration)}
                                          <span className="mx-1">•</span>
                                          {new Date(log.startTime).toLocaleString()}
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                          <div className="text-xs text-muted-foreground">
                                            {log.user.name}
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteLog(log.id);
                                            }}
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="text-red-500"
                                            >
                                              <path d="M3 6h18"></path>
                                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              {searchQuery ? "No logs matching search criteria" : "No logs found"}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Log Details */}
                    <div className="md:col-span-2 space-y-4">
                      {selectedLogId ? (
                        logDetailLoading ? (
                          <Card className="min-h-[300px] flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </Card>
                        ) : logDetail ? (
                          <>
                            <Card className="mb-4">
                              <CardHeader className="pb-3">
                                <div className="flex justify-between">
                                  <div>
                                    <CardTitle>Performance Analysis</CardTitle>
                                    <CardDescription>
                                      Key metrics and performance insights
                                    </CardDescription>
                                  </div>
                                  <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">
                                    {formatDuration(logDetail.performance.totalExecutionTime)}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                  <div className="bg-primary-50 p-4 rounded-lg">
                                    <div className="flex items-center text-primary mb-2">
                                      <Clock className="h-5 w-5 mr-2" />
                                      <span className="font-medium">Apex Execution</span>
                                    </div>
                                    <div className="text-2xl font-semibold">
                                      {formatDuration(logDetail.performance.apexExecutionTime)}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {((logDetail.performance.apexExecutionTime / logDetail.performance.totalExecutionTime) * 100).toFixed(1)}% of total time
                                    </div>
                                  </div>
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center text-blue-600 mb-2">
                                      <Database className="h-5 w-5 mr-2" />
                                      <span className="font-medium">Database Time</span>
                                    </div>
                                    <div className="text-2xl font-semibold">
                                      {formatDuration(logDetail.performance.databaseTime)}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {((logDetail.performance.databaseTime / logDetail.performance.totalExecutionTime) * 100).toFixed(1)}% of total time
                                    </div>
                                  </div>
                                  <div className="bg-red-50 p-4 rounded-lg">
                                    <div className="flex items-center text-red-600 mb-2">
                                      <Flame className="h-5 w-5 mr-2" />
                                      <span className="font-medium">Heap Usage</span>
                                    </div>
                                    <div className="text-2xl font-semibold">
                                      {formatBytes(logDetail.performance.heapUsage)}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {logDetail.performance.limitUsage.find(l => l.name === 'Heap Size')?.percentage || 0}% of limit
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                  {/* Slowest Queries */}
                                  <div>
                                    <h3 className="font-medium mb-2 text-sm text-muted-foreground">Slowest Queries</h3>
                                    {logDetail.performance.slowestQueries.length > 0 ? (
                                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {logDetail.performance.slowestQueries.slice(0, 5).map((query, index) => (
                                          <div key={index} className="bg-neutral-100 p-3 rounded-md text-sm">
                                            <div className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap mb-1">
                                              {query.query}
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                              <Badge variant="outline">{query.rows} rows</Badge>
                                              <span className="text-orange-500 font-medium">
                                                {formatDuration(query.time)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-muted-foreground text-sm">
                                        No slow queries detected
                                      </div>
                                    )}
                                  </div>

                                  {/* Slowest Methods */}
                                  <div>
                                    <h3 className="font-medium mb-2 text-sm text-muted-foreground">Slowest Methods</h3>
                                    {logDetail.performance.slowestMethods.length > 0 ? (
                                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {logDetail.performance.slowestMethods.slice(0, 5).map((method, index) => (
                                          <div key={index} className="bg-neutral-100 p-3 rounded-md text-sm">
                                            <div className="font-medium">
                                              {method.className}.{method.methodName}
                                            </div>
                                            <div className="flex justify-between items-center text-xs mt-1">
                                              <Badge variant="outline">Called {method.called} times</Badge>
                                              <span className="text-orange-500 font-medium">
                                                {formatDuration(method.time)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-muted-foreground text-sm">
                                        No slow methods detected
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Governor Limits */}
                                <div className="mt-6">
                                  <h3 className="font-medium mb-2 text-sm text-muted-foreground">Governor Limits Usage</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {logDetail.performance.limitUsage.map((limit, index) => (
                                      <div key={index} className="bg-neutral-100 p-2 rounded-md">
                                        <div className="text-xs font-medium mb-1">{limit.name}</div>
                                        <div className="w-full bg-neutral-200 rounded-full h-2">
                                          <div
                                            className={`h-2 rounded-full ${
                                              limit.percentage > 90
                                                ? "bg-red-500"
                                                : limit.percentage > 70
                                                ? "bg-orange-500"
                                                : "bg-green-500"
                                            }`}
                                            style={{ width: `${limit.percentage}%` }}
                                          ></div>
                                        </div>
                                        <div className="flex justify-between text-xs mt-1">
                                          <span>{limit.used}/{limit.total}</span>
                                          <span>{limit.percentage}%</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <div className="flex justify-between">
                                  <CardTitle>Log Events</CardTitle>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                                  >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                    <ChevronsUpDown className="h-4 w-4 ml-1" />
                                  </Button>
                                </div>
                                {showFilterPanel && (
                                  <div className="mt-2 p-2 bg-neutral-50 rounded-md border text-sm">
                                    <div className="mb-2">
                                      <div className="font-medium mb-1">Event Types</div>
                                      <div className="flex flex-wrap gap-2">
                                        {Object.keys(eventFilter).map((category) => (
                                          <div key={category} className="flex items-center">
                                            <Checkbox
                                              id={`category-${category}`}
                                              checked={eventFilter[category]}
                                              onCheckedChange={() => handleToggleEventFilter(category)}
                                            />
                                            <label
                                              htmlFor={`category-${category}`}
                                              className="ml-2 text-xs font-medium"
                                            >
                                              {category.replace('_', ' ')}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="font-medium mb-1">Severity</div>
                                      <div className="flex flex-wrap gap-2">
                                        {Object.keys(severityFilter).map((severity) => (
                                          <div key={severity} className="flex items-center">
                                            <Checkbox
                                              id={`severity-${severity}`}
                                              checked={severityFilter[severity]}
                                              onCheckedChange={() => handleToggleSeverityFilter(severity)}
                                            />
                                            <label
                                              htmlFor={`severity-${severity}`}
                                              className="ml-2 text-xs font-medium"
                                            >
                                              {severity}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardHeader>
                              <CardContent>
                                <div className="max-h-[500px] overflow-y-auto border rounded-md">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[120px]">Time</TableHead>
                                        <TableHead className="w-[100px]">Type</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="w-[100px] text-right">Duration</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {filteredEvents.length > 0 ? (
                                        filteredEvents.map((event, index) => (
                                          <TableRow key={index}>
                                            <TableCell className="align-top py-2">
                                              <div className="text-xs">{event.timestamp}</div>
                                              <div className="text-xs text-muted-foreground">Line {event.line}</div>
                                            </TableCell>
                                            <TableCell className="align-top py-2">
                                              <Badge
                                                variant="outline"
                                                className={`${
                                                  event.severity === 'ERROR'
                                                    ? 'border-red-200 text-red-700 bg-red-50'
                                                    : event.severity === 'WARNING'
                                                    ? 'border-amber-200 text-amber-700 bg-amber-50'
                                                    : event.category === 'EXCEPTION'
                                                    ? 'border-red-200 text-red-700 bg-red-50'
                                                    : event.category === 'SOQL'
                                                    ? 'border-blue-200 text-blue-700 bg-blue-50'
                                                    : event.category === 'DML'
                                                    ? 'border-purple-200 text-purple-700 bg-purple-50'
                                                    : 'border-neutral-200'
                                                }`}
                                              >
                                                {event.category}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="align-top py-2">
                                              <div className="text-sm font-mono whitespace-pre-wrap text-xs">
                                                {event.details}
                                              </div>
                                            </TableCell>
                                            <TableCell className="align-top py-2 text-right">
                                              {event.executionTime ? (
                                                <span className="text-xs font-medium">
                                                  {formatDuration(event.executionTime)}
                                                </span>
                                              ) : null}
                                              {event.heapSize ? (
                                                <div className="text-xs text-muted-foreground">
                                                  {formatBytes(event.heapSize)}
                                                </div>
                                              ) : null}
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                            {logDetail.events.length > 0
                                              ? "No events match the current filters"
                                              : "No events found in this log"}
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        ) : (
                          <Card className="min-h-[300px] flex flex-col items-center justify-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Failed to load log details</h3>
                            <p className="text-center text-muted-foreground max-w-md mt-2">
                              There was an error loading the log details. Please try selecting a different log.
                            </p>
                          </Card>
                        )
                      ) : (
                        <Card className="min-h-[300px] flex flex-col items-center justify-center">
                          <Code className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium">Select a log to view details</h3>
                          <p className="text-center text-muted-foreground max-w-md mt-2">
                            Choose a log from the list to view detailed performance metrics, execution timeline, and analyze bottlenecks.
                          </p>
                        </Card>
                      )}
                    </div>
                  </div>
              </TabsContent>

              {/* Trace Flags Tab */}
              <TabsContent value="traceFlags" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Trace Flag Creator */}
                    <div className="md:col-span-1">
                      <Card>
                        <CardHeader>
                          <CardTitle>Create Debug Trace</CardTitle>
                          <CardDescription>
                            Set up debug logging for a user or Apex class
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">User</label>
                            {usersLoading ? (
                              <div className="h-9 bg-neutral-100 animate-pulse rounded-md"></div>
                            ) : (
                              <Select value={selectedUserId || ""} onValueChange={setSelectedUserId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a user" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users?.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Expiration (minutes)</label>
                            <Input
                              type="number"
                              value={expiration}
                              onChange={(e) => setExpiration(e.target.value)}
                              min="1"
                              max="1440"
                            />
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Debug Log Levels</p>
                            <div className="space-y-2">
                              {Object.entries(debugLevels).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-3 gap-2 items-center">
                                  <label className="text-sm font-medium col-span-1 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </label>
                                  <div className="col-span-2">
                                    <Select
                                      value={value}
                                      onValueChange={(newValue) => handleDebugLevelChange(key, newValue)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {LOG_LEVEL_OPTIONS.map((option) => (
                                          <SelectItem key={option.level} value={option.level}>
                                            {option.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            onClick={handleCreateTraceFlag}
                            disabled={createTraceFlagMutation.isPending || !selectedUserId}
                            className="w-full"
                          >
                            {createTraceFlagMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>Create Trace Flag</>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>

                    {/* Active Trace Flags */}
                    <div className="md:col-span-2">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle>Active Trace Flags</CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refetchTraceFlags()}
                              disabled={traceFlagsLoading}
                            >
                              {traceFlagsLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {traceFlagsLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : traceFlags?.length ? (
                            <div className="space-y-4">
                              {traceFlags.map((flag) => {
                                const expirationDate = new Date(flag.expirationDate);
                                const now = new Date();
                                const isExpired = expirationDate < now;
                                const hoursRemaining = Math.max(
                                  0,
                                  Math.round((expirationDate.getTime() - now.getTime()) / 3600000)
                                );
                                
                                return (
                                  <div
                                    key={flag.id}
                                    className={`border rounded-lg p-4 ${
                                      isExpired ? "bg-neutral-50 border-neutral-200" : "bg-white"
                                    }`}
                                  >
                                    <div className="flex justify-between">
                                      <div>
                                        <h3 className="font-medium">
                                          Debug for{" "}
                                          <span className="text-primary">
                                            {flag.tracedEntityType === "User" ? "User" : "Apex Class"}
                                          </span>
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                          Debug Level: {flag.debugLevel.developerName}
                                        </p>
                                      </div>
                                      <Badge
                                        variant={isExpired ? "outline" : "default"}
                                        className={
                                          isExpired
                                            ? "bg-neutral-100 text-neutral-500"
                                            : hoursRemaining < 1
                                            ? "bg-red-100 text-red-700 border-red-200"
                                            : "bg-green-100 text-green-700 border-green-200"
                                        }
                                      >
                                        {isExpired
                                          ? "Expired"
                                          : hoursRemaining < 1
                                          ? "< 1 hour left"
                                          : `${hoursRemaining} hours left`}
                                      </Badge>
                                    </div>
                                    
                                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">Start:</span>{" "}
                                        {new Date(flag.startDate).toLocaleString()}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Expires:</span>{" "}
                                        {new Date(flag.expirationDate).toLocaleString()}
                                      </div>
                                      <div className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => handleDeleteTraceFlag(flag.id)}
                                          disabled={deleteTraceFlagMutation.isPending}
                                        >
                                          {deleteTraceFlagMutation.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            "Delete"
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                                      <div className="space-y-1">
                                        <div className="font-medium">Apex</div>
                                        <Badge variant="outline" className="w-full justify-center">
                                          {flag.debugLevel.apexCode}
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="font-medium">Database</div>
                                        <Badge variant="outline" className="w-full justify-center">
                                          {flag.debugLevel.database}
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="font-medium">System</div>
                                        <Badge variant="outline" className="w-full justify-center">
                                          {flag.debugLevel.system}
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="font-medium">Validation</div>
                                        <Badge variant="outline" className="w-full justify-center">
                                          {flag.debugLevel.validation}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              No active trace flags found
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
              </TabsContent>

              {/* AI Assistant Tab */}
              <TabsContent value="aiAssistant" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Debug Assistant</CardTitle>
                    <CardDescription>
                      Use AI to analyze Apex logs, get insights, and solve debugging problems with various AI models
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <AIModelSelector />
                    </div>
                    <div className="mb-4">
                      <LogSelector />
                    </div>
                    <AIAnalysisInterface />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            )}
          </div>
        </main>
      </div>
  );
}

// AI ASSISTANT COMPONENTS

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  requiresKey: boolean;
}

// AI models supported by the application
const AI_MODELS: AIModel[] = [
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    description: 'High-performance model for code analysis and optimization',
    requiresKey: true
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Advanced reasoning and code understanding capabilities',
    requiresKey: true
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    provider: 'Anthropic',
    description: 'Excellent at detailed log analysis and debugging assistance',
    requiresKey: true
  },
  {
    id: 'llama-3',
    name: 'Llama 3',
    provider: 'Meta',
    description: 'Open model with strong performance on Apex code analysis',
    requiresKey: false
  },
  {
    id: 'deepseek',
    name: 'DeepSeek Coder',
    provider: 'DeepSeek',
    description: 'Specialized in programming tasks and debugging',
    requiresKey: true
  }
];

function AIModelSelector() {
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0].id);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();
  
  const selectedModelInfo = AI_MODELS.find(model => model.id === selectedModel);
  
  const handleModelChange = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId);
    setSelectedModel(modelId);
    
    if (model?.requiresKey) {
      // Check if we already have a key for this model
      const storedKey = localStorage.getItem(`${modelId}-api-key`);
      if (!storedKey) {
        setShowApiKeyDialog(true);
      }
    }
  };
  
  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }
    
    localStorage.setItem(`${selectedModel}-api-key`, apiKey);
    setShowApiKeyDialog(false);
    setApiKey('');
    
    toast({
      title: "API Key Saved",
      description: `Your ${selectedModelInfo?.name} API key has been saved`,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ai-model" className="text-sm font-medium">AI Model</Label>
        <Select value={selectedModel} onValueChange={handleModelChange}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map(model => (
              <SelectItem key={model.id} value={model.id} className="flex items-center">
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-muted-foreground">{model.provider}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedModelInfo && (
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            {selectedModelInfo.requiresKey ? (
              <>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-amber-500" />
                  <span>Requires API key</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="ml-2 h-7 px-2 text-xs"
                  onClick={() => setShowApiKeyDialog(true)}
                >
                  <Settings className="h-3.5 w-3.5 mr-1" />
                  Configure
                </Button>
              </>
            ) : (
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 mr-1 text-green-500" />
                <span>Included with your subscription</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {selectedModelInfo && (
        <div className="bg-neutral-100 p-3 rounded-md">
          <div className="text-sm">{selectedModelInfo.description}</div>
        </div>
      )}
      
      <AlertDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter API Key for {selectedModelInfo?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              To use {selectedModelInfo?.name} by {selectedModelInfo?.provider}, you need to provide your own API key.
              This key will be securely stored in your browser's local storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="api-key" className="text-sm font-medium">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveApiKey}>Save Key</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LogSelector() {
  const { activeOrg } = useOrgContext();
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  
  // Reuse the logs query from parent component
  const { 
    data: logs,
    isLoading: logsLoading
  } = useQuery<ApexLog[]>({
    queryKey: [`/api/orgs/${activeOrg?.id}/apex-logs`],
    enabled: !!activeOrg,
  });
  
  if (logsLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading logs...</span>
      </div>
    );
  }
  
  if (!logs || logs.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No logs available</AlertTitle>
        <AlertDescription>
          There are no Apex logs available for analysis. Create trace flags to generate logs.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-2">
      <Label htmlFor="selected-log" className="text-sm font-medium">Select Log to Analyze</Label>
      <Select value={selectedLog || ''} onValueChange={setSelectedLog}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose an Apex log" />
        </SelectTrigger>
        <SelectContent>
          {logs.map(log => (
            <SelectItem key={log.id} value={log.id}>
              <div className="truncate max-w-[300px]">
                <span className="font-medium">{log.operation}</span>
                <span className="text-muted-foreground text-xs ml-2">
                  ({new Date(log.startTime).toLocaleString()})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AIAnalysisInterface() {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleAnalysis = () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a question or issue to analyze",
        variant: "destructive"
      });
      return;
    }
    
    // Simulated analysis for demo purposes
    setIsAnalyzing(true);
    setResult(null);
    
    // In a real implementation, this would call the API with the selected log and model
    setTimeout(() => {
      setIsAnalyzing(false);
      
      // Example analysis result
      setResult(`
## Performance Analysis

Based on the selected log, I've identified potential issues:

1. **Database Query Bottleneck**
   - 5 SOQL queries taking 3.2s total execution time
   - Repeated query in AccountController.getRelatedContacts()
   - Recommendation: Implement a single bulk query instead of multiple calls

2. **Heap Size Issues**
   - Peak heap usage at 85% of governor limit
   - Large object instantiation at line 142 in OpportunityService
   - Recommendation: Break processing into smaller batches

3. **Governor Limit Warnings**
   - DML statements at 72% of limit
   - Query rows at 68% of limit
   - CPU time at 55% of limit

The primary issue appears to be the inefficient query pattern in the AccountController class. Consider refactoring to use a more efficient data access pattern.
      `);
    }, 2000);
  };
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="analysis-query" className="text-sm font-medium">Your Question or Issue</Label>
        <Textarea
          id="analysis-query"
          placeholder="Describe what you want to analyze or fix... (e.g., Why is my trigger running slowly? What's causing the heap size limit exception?)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1 min-h-[100px]"
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleAnalysis} 
          disabled={isAnalyzing}
          className="flex items-center"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Analyze with AI
            </>
          )}
        </Button>
      </div>
      
      {result && (
        <div className="mt-6 border rounded-lg p-4 bg-white">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI Analysis Results
          </h3>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{result}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Filter(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}