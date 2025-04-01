import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { SavedQuery } from "@shared/schema";
import { 
  Maximize2, 
  Play, 
  Save, 
  Copy, 
  ChevronDown,
  Download,
  Wand2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface SoqlEditorProps {
  orgId: number;
}

export default function SoqlEditor({ orgId }: SoqlEditorProps) {
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
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: savedQueries, isLoading: isLoadingSavedQueries } = useQuery<SavedQuery[]>({
    queryKey: [`/api/orgs/${orgId}/saved-queries`],
    enabled: Boolean(orgId),
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      const startTime = performance.now();
      const res = await apiRequest("POST", `/api/orgs/${orgId}/query`, { query });
      const endTime = performance.now();
      setExecutionTime((endTime - startTime) / 1000);
      return await res.json();
    },
    onSuccess: (data) => {
      setQueryResults(data);
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
      const res = await apiRequest("POST", `/api/orgs/${orgId}/saved-queries`, { 
        name: queryName, 
        query
      });
      return await res.json();
    },
    onSuccess: () => {
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

  const loadSavedQuery = (id: string) => {
    const selectedQuery = savedQueries?.find(q => q.id.toString() === id);
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
      Object.keys(queryResults.records[0]).join(','),
      // Data rows
      ...queryResults.records.map((record: any) => 
        Object.values(record).map(value => 
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
  };

  return (
    <Card>
      <div className="px-4 py-5 border-b border-neutral-200 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-base font-medium text-neutral-800">SOQL Query Editor</h3>
          <p className="mt-1 text-sm text-neutral-500">Build and execute Salesforce queries</p>
        </div>
        <div>
          <Button variant="ghost" size="icon" aria-label="Fullscreen">
            <Maximize2 className="h-5 w-5 text-primary-600" />
          </Button>
        </div>
      </div>
      <div className="p-4 flex flex-col h-80">
        <div className="flex-1 mb-3 font-mono text-sm rounded-md border border-neutral-300 overflow-hidden">
          <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-auto"
                onClick={executeQuery}
                disabled={executeMutation.isPending}
              >
                <Play className="h-4 w-4" />
              </Button>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <Save className="h-4 w-4" />
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
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 h-auto"
                onClick={handleCopyQuery}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Select onValueChange={loadSavedQuery}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Recent Queries" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSavedQueries ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : savedQueries && savedQueries.length > 0 ? (
                    savedQueries.map(q => (
                      <SelectItem key={q.id} value={q.id.toString()}>
                        {q.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>No saved queries</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div 
            ref={editorRef}
            className="p-3 bg-neutral-800 text-white h-full overflow-auto whitespace-pre-wrap"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setQuery(e.currentTarget.textContent || "")}
            dangerouslySetInnerHTML={{ __html: query }}
          />
        </div>
        <div className="flex-1 overflow-auto border border-neutral-300 rounded-md">
          {executeMutation.isPending ? (
            <div className="h-full flex items-center justify-center">
              <Skeleton className="h-8 w-8 rounded-full animate-spin" />
              <span className="ml-2 text-sm text-neutral-600">Executing query...</span>
            </div>
          ) : queryResults?.records?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
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
            <div className="h-full flex items-center justify-center text-sm text-neutral-500">
              No records found
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-neutral-500">
              Execute a query to see results
            </div>
          )}
        </div>
      </div>
      <div className="bg-neutral-50 px-4 py-3 sm:px-6 flex justify-between items-center">
        <div className="text-sm text-neutral-500">
          {queryResults ? (
            <span>
              <span className="font-medium">{queryResults.totalSize || queryResults.records?.length || 0}</span> records returned in <span className="font-medium">{executionTime?.toFixed(2) || '0.00'}s</span>
            </span>
          ) : (
            <span>Ready to execute</span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={downloadResults}
            disabled={!queryResults?.records?.length}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-8"
          >
            <Wand2 className="h-4 w-4 mr-1" />
            Optimize Query
          </Button>
        </div>
      </div>
    </Card>
  );
}
