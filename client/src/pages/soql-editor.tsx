import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import QueryEditor from "@/components/soql/query-editor";
import QueryBuilder from "@/components/soql/query-builder";
import { useOrgContext } from "@/hooks/use-org";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { executeMockSoqlQuery } from "@/lib/mock-data";

interface QueryResult {
  records: Record<string, any>[];
  totalSize: number;
  done: boolean;
}

export default function SOQLEditor() {
  const { activeOrg } = useOrgContext();
  const { toast } = useToast();
  const [query, setQuery] = useState<string>("SELECT Id, Name, AccountNumber, Type, Industry, AnnualRevenue\nFROM Account\nWHERE AnnualRevenue > 1000000\nORDER BY AnnualRevenue DESC\nLIMIT 10");
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [mode, setMode] = useState<'editor' | 'builder'>(() => {
    // Get saved preference from localStorage
    const savedMode = localStorage.getItem('soql-editor-mode');
    return (savedMode === 'editor' || savedMode === 'builder') ? savedMode : 'editor';
  });

  // Save mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('soql-editor-mode', mode);
  }, [mode]);
  
  // Execute query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      if (!activeOrg) {
        // Use mock query execution when no org is connected
        return executeMockSoqlQuery(query);
      }
      const res = await apiRequest("POST", `/api/orgs/${activeOrg.id}/query`, { query });
      return await res.json();
    },
    onSuccess: (data) => {
      setQueryResults(data);
    },
    onError: (error) => {
      console.error("Error executing query:", error);
      toast({
        variant: "destructive",
        title: "Query Error",
        description: error instanceof Error ? error.message : "Failed to execute query"
      });
    },
  });

  // Format query
  const formatQuery = () => {
    // Simple formatting for demonstration
    try {
      const formattedQuery = query
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\(\s*/g, '(')
        .replace(/\s*\)/g, ')')
        .replace(/\s*=\s*/g, ' = ')
        .replace(/\s*>\s*/g, ' > ')
        .replace(/\s*<\s*/g, ' < ')
        .replace(/SELECT/i, 'SELECT\n')
        .replace(/FROM/i, '\nFROM')
        .replace(/WHERE/i, '\nWHERE')
        .replace(/ORDER BY/i, '\nORDER BY')
        .replace(/GROUP BY/i, '\nGROUP BY')
        .replace(/HAVING/i, '\nHAVING')
        .replace(/LIMIT/i, '\nLIMIT')
        .replace(/OFFSET/i, '\nOFFSET');
      
      setQuery(formattedQuery);
    } catch (error) {
      console.error("Error formatting query:", error);
    }
  };

  // Optimize query
  const optimizeQuery = () => {
    // Simple optimization for demonstration
    try {
      let optimizedQuery = query;
      
      // Remove duplicate fields
      const selectMatch = optimizedQuery.match(/SELECT\s+(.*?)\s+FROM/i);
      if (selectMatch && selectMatch[1]) {
        const fields = selectMatch[1].split(',').map(f => f.trim());
        const uniqueFields = Array.from(new Set(fields));
        optimizedQuery = optimizedQuery.replace(
          /SELECT\s+(.*?)\s+FROM/i,
          `SELECT ${uniqueFields.join(', ')} FROM`
        );
      }
      
      // Add LIMIT if not present
      if (!optimizedQuery.match(/LIMIT\s+\d+/i)) {
        optimizedQuery += '\nLIMIT 2000';
      }
      
      setQuery(optimizedQuery);
    } catch (error) {
      console.error("Error optimizing query:", error);
    }
  };
  
  // Handle query execution from the builder
  const handleExecuteFromBuilder = (builtQuery: string) => {
    setQuery(builtQuery);
    executeQueryMutation.mutate(builtQuery);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* SOQL Editor Header */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">SOQL/SOSL Editor</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Write, optimize, and execute Salesforce queries
            </p>
          </div>
          <div className="flex items-center">
            <Tabs value={mode} onValueChange={(value) => setMode(value as 'editor' | 'builder')}>
              <TabsList>
                <TabsTrigger value="editor">Editor Mode</TabsTrigger>
                <TabsTrigger value="builder">Drag & Drop Mode</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Query Editor/Builder Modes */}
        <Card className="mb-6 shadow-sm border border-neutral-200">
          <CardHeader className="border-b border-neutral-200 flex flex-row items-center justify-between py-3">
            <CardTitle>{mode === 'editor' ? 'Query Editor' : 'Query Canvas'}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {mode === 'editor' ? (
              <>
                <QueryEditor value={query} onChange={setQuery} />
                
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    onClick={() => executeQueryMutation.mutate(query)}
                    disabled={executeQueryMutation.isPending || !query.trim()}
                  >
                    {executeQueryMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      "Execute Query"
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={formatQuery}
                    disabled={!query.trim()}
                  >
                    Format
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={optimizeQuery}
                    disabled={!query.trim()}
                  >
                    Optimize
                  </Button>
                </div>
              </>
            ) : (
              <QueryBuilder onExecuteQuery={handleExecuteFromBuilder} />
            )}
          </CardContent>
        </Card>

        {/* Query Results */}
        <Card className="shadow-sm border border-neutral-200">
          <CardHeader className="border-b border-neutral-200">
            <CardTitle>Query Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {executeQueryMutation.isPending ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : !queryResults ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">Execute a query to see results</p>
              </div>
            ) : queryResults.records && queryResults.records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-neutral-50 text-neutral-500">
                    <tr>
                      {Object.keys(queryResults.records[0]).map((key) => (
                        <th key={key} className="px-6 py-3">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResults.records.map((record, index) => (
                      <tr key={index} className="border-b hover:bg-neutral-50">
                        {Object.values(record).map((value, i) => (
                          <td key={i} className="px-6 py-4">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-neutral-500">No records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}