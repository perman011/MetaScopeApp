import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import OrgContext from "@/components/org-context";
import FilterBar from "@/components/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SalesforceOrg, SavedQuery } from "@shared/schema";
import { Loader2, Play, Save, Copy, Download, Clock, Bookmark, Wand2, RotateCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function SoqlPage() {
  const [location, setLocation] = useLocation();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [query, setQuery] = useState<string>(`SELECT Id, Name, Type, Industry, AnnualRevenue
FROM Account
WHERE AnnualRevenue > 1000000
AND Type = 'Customer - Direct'
ORDER BY AnnualRevenue DESC
LIMIT 10`);
  const [queryName, setQueryName] = useState<string>("");
  const [queryResults, setQueryResults] = useState<any | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: orgs, isLoading } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
  });

  const { data: savedQueries, isLoading: isLoadingSavedQueries } = useQuery<SavedQuery[]>({
    queryKey: [`/api/orgs/${selectedOrgId}/saved-queries`],
    enabled: Boolean(selectedOrgId),
  });

  // Extract org ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const orgId = params.get("org");
    if (orgId) {
      setSelectedOrgId(parseInt(orgId));
    }
  }, [location]);

  // Set the first org as selected if none is selected and orgs are loaded
  useEffect(() => {
    if (!selectedOrgId && orgs && orgs.length > 0) {
      const activeOrg = orgs.find(org => org.isActive) || orgs[0];
      setSelectedOrgId(activeOrg.id);
    } else if (orgs && orgs.length === 0) {
      // Redirect to organizations page if no orgs are connected
      setLocation("/organizations?action=connect");
    }
  }, [orgs, selectedOrgId, setLocation]);

  const executeMutation = useMutation({
    mutationFn: async () => {
      const startTime = performance.now();
      const res = await apiRequest("POST", `/api/orgs/${selectedOrgId}/query`, { query });
      const endTime = performance.now();
      setExecutionTime((endTime - startTime) / 1000);
      return await res.json();
    },
    onSuccess: (data) => {
      setQueryResults(data);
      setActiveTab("results");
      toast({
        title: "Query executed successfully",
        description: `Retrieved ${data.totalSize || data.records?.length || 0} records`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Query execution failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveQueryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/orgs/${selectedOrgId}/saved-queries`, { 
        name: queryName, 
        query
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${selectedOrgId}/saved-queries`] });
      toast({
        title: "Query saved successfully",
        description: "Your query has been saved and can be accessed from the dropdown",
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save query",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const executeQuery = () => {
    if (!query.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a SOQL query to execute",
        variant: "destructive",
      });
      return;
    }
    executeMutation.mutate();
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query);
    toast({
      title: "Query copied to clipboard",
    });
  };

  const handleSaveQuery = () => {
    if (!queryName.trim()) {
      toast({
        title: "Please enter a name for your query",
        variant: "destructive",
      });
      return;
    }
    saveQueryMutation.mutate();
  };

  const loadSavedQuery = (id: number) => {
    const selectedQuery = savedQueries?.find(q => q.id === id);
    if (selectedQuery) {
      setQuery(selectedQuery.query);
      toast({
        title: "Query loaded",
        description: `Loaded query: ${selectedQuery.name}`,
      });
    }
  };

  const downloadResults = () => {
    if (!queryResults?.records?.length) return;
    
    const rows = [
      // Headers
      Object.keys(queryResults.records[0])
        .filter(key => key !== 'attributes')
        .join(','),
      // Data rows
      ...queryResults.records.map((record: any) => 
        Object.entries(record)
          .filter(([key]) => key !== 'attributes')
          .map(([, value]) => 
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          ).join(',')
      )
    ];
    
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'query_results.csv');
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Results exported",
      description: "The query results have been downloaded as CSV",
    });
  };

  const handleOrgChange = (orgId: number) => {
    setSelectedOrgId(orgId);
    setLocation(`/soql?org=${orgId}`);
  };

  const getSyntaxHighlightedQuery = () => {
    return query
      .replace(/\b(SELECT|FROM|WHERE|AND|OR|LIMIT|OFFSET|ORDER BY|GROUP BY|HAVING|WITH|USING SCOPE|FOR VIEW|FOR REFERENCE|UPDATE|DELETE|INSERT|UPSERT)\b/gi, 
        match => `<span class="text-primary-400">${match}</span>`)
      .replace(/('[^']*')/g, 
        match => `<span class="text-secondary-400">${match}</span>`)
      .replace(/\b(\d+)\b/g, 
        match => `<span class="text-amber-400">${match}</span>`);
  };

  const handleSearch = () => {
    toast({
      title: "Search not implemented",
      description: "Search functionality for the SOQL editor is coming soon",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary-500 mb-4" />
              <p className="text-neutral-500">Loading organizations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 lg:p-6">
          {selectedOrgId && (
            <>
              <OrgContext orgId={selectedOrgId} onOrgChange={handleOrgChange} />
              
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>SOQL/SOSL Query Editor</CardTitle>
                    <CardDescription>Build, optimize, and execute Salesforce queries</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Clock className="h-4 w-4 mr-2" />
                          Recent Queries
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        {isLoadingSavedQueries ? (
                          <DropdownMenuItem disabled>Loading saved queries...</DropdownMenuItem>
                        ) : savedQueries && savedQueries.length > 0 ? (
                          <>
                            {savedQueries.map(q => (
                              <DropdownMenuItem key={q.id} onClick={() => loadSavedQuery(q.id)}>
                                <Bookmark className="h-4 w-4 mr-2" />
                                <span className="truncate">{q.name}</span>
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Manage Saved Queries
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem disabled>No saved queries</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button variant="outline" size="sm" onClick={handleCopyQuery}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save Query</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <Input
                            placeholder="Query name"
                            value={queryName}
                            onChange={(e) => setQueryName(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            onClick={handleSaveQuery}
                            disabled={saveQueryMutation.isPending}
                          >
                            {saveQueryMutation.isPending ? "Saving..." : "Save Query"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button onClick={executeQuery} disabled={executeMutation.isPending}>
                      {executeMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Execute Query
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="editor" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="editor">Query Editor</TabsTrigger>
                      <TabsTrigger value="results">Results {queryResults && `(${queryResults.totalSize || queryResults.records?.length || 0})`}</TabsTrigger>
                      <TabsTrigger value="explain">Explain Plan</TabsTrigger>
                      <TabsTrigger value="history">Query History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="editor" className="mt-0">
                      <div className="border border-neutral-200 rounded-md overflow-hidden">
                        <div 
                          ref={editorRef}
                          className="p-3 bg-neutral-800 text-white h-[500px] overflow-auto whitespace-pre-wrap font-mono text-sm"
                          contentEditable
                          suppressContentEditableWarning
                          onInput={(e) => setQuery(e.currentTarget.textContent || "")}
                          dangerouslySetInnerHTML={{ __html: getSyntaxHighlightedQuery() }}
                        />
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-neutral-500">
                          Use standard SOQL syntax. Press Execute Query to run.
                        </div>
                        <Button variant="outline" size="sm">
                          <Wand2 className="h-4 w-4 mr-2" />
                          Optimize Query
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="results" className="mt-0">
                      <div className="border border-neutral-200 rounded-md overflow-hidden bg-white">
                        {executeMutation.isPending ? (
                          <div className="h-[500px] flex items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                          </div>
                        ) : queryResults?.records?.length > 0 ? (
                          <div className="overflow-auto h-[500px]">
                            <table className="min-w-full divide-y divide-neutral-200">
                              <thead className="bg-neutral-50 sticky top-0">
                                <tr>
                                  {Object.keys(queryResults.records[0])
                                    .filter(key => key !== 'attributes')
                                    .map((key) => (
                                      <th 
                                        key={key} 
                                        scope="col" 
                                        className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                                      >
                                        {key}
                                      </th>
                                    ))
                                  }
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-neutral-200 text-sm">
                                {queryResults.records.map((record: any, i: number) => (
                                  <tr key={i}>
                                    {Object.entries(record)
                                      .filter(([key]) => key !== 'attributes')
                                      .map(([key, value]) => (
                                        <td 
                                          key={key} 
                                          className={`px-3 py-2 whitespace-nowrap ${
                                            key === 'Id' ? 'text-neutral-500 font-mono text-xs' : 
                                            key === 'Name' ? 'font-medium' : ''
                                          }`}
                                        >
                                          {value !== null && value !== undefined ? String(value) : ''}
                                        </td>
                                      ))
                                    }
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : queryResults?.records?.length === 0 ? (
                          <div className="h-[500px] flex items-center justify-center">
                            <div className="text-center">
                              <RotateCw className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
                              <p className="text-neutral-500">No records found</p>
                              <p className="text-sm text-neutral-400 mt-1">The query executed successfully but returned no results</p>
                            </div>
                          </div>
                        ) : (
                          <div className="h-[500px] flex items-center justify-center">
                            <div className="text-center">
                              <Play className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
                              <p className="text-neutral-500">No query results</p>
                              <p className="text-sm text-neutral-400 mt-1">Execute a query to see results</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-neutral-500">
                          {queryResults && executionTime && (
                            <span>
                              <span className="font-medium">{queryResults.totalSize || queryResults.records?.length || 0}</span> records returned in <span className="font-medium">{executionTime.toFixed(2)}s</span>
                            </span>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={downloadResults}
                          disabled={!queryResults?.records?.length}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Results
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="explain" className="mt-0">
                      <div className="border border-neutral-200 rounded-md overflow-hidden bg-white h-[500px] flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-neutral-500">Query explain plan feature coming soon</p>
                          <p className="text-sm text-neutral-400 mt-1">This feature will provide insights into query execution and optimization</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="history" className="mt-0">
                      <div className="border border-neutral-200 rounded-md overflow-hidden bg-white h-[500px] flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-neutral-500">Query history feature coming soon</p>
                          <p className="text-sm text-neutral-400 mt-1">Track your recent queries and their execution times</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
