import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useOrg } from '@/hooks/use-org';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import AiQueryAssistant from '@/components/soql/query-canvas/AiQueryAssistant';
import QueryCanvas from '@/components/soql/query-canvas/QueryCanvas';
import { mockSalesforceMetadata } from '@/lib/mock-data';

export default function SoqlEditorPage() {
  const { activeOrg } = useOrg();
  const { toast } = useToast();
  const [mode, setMode] = useState<'editor' | 'builder'>('editor');
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Execute SOQL query
  const executeQuery = async (queryToExecute?: string) => {
    const finalQuery = queryToExecute || query;
    if (!finalQuery.trim()) return;
    
    setIsExecuting(true);
    
    try {
      // For demo, we'll use mock data for results
      const mockResults = getMockResults(finalQuery);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      setQueryResults(mockResults);
      toast({
        title: 'Query executed successfully',
        description: `Returned ${mockResults.length} records`,
      });
    } catch (error) {
      console.error('Error executing query:', error);
      toast({
        title: 'Query execution failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Get mock results based on the query
  const getMockResults = (query: string) => {
    // Parse the query to determine what kind of results to return
    const isAccountQuery = query.toLowerCase().includes('from account');
    const isOpportunityQuery = query.toLowerCase().includes('from opportunity');
    const isContactQuery = query.toLowerCase().includes('from contact');
    
    // Return appropriate mock data based on query
    if (isAccountQuery) {
      return [
        { Id: '001xx000003DGbIAAW', Name: 'Acme Inc.', Industry: 'Technology', Type: 'Customer', Website: 'https://acme.com' },
        { Id: '001xx000003DGbJAAW', Name: 'Universal Services', Industry: 'Healthcare', Type: 'Customer', Website: 'https://universal.org' },
        { Id: '001xx000003DGbKAAW', Name: 'Global Systems', Industry: 'Manufacturing', Type: 'Prospect', Website: 'https://globalsys.net' },
        { Id: '001xx000003DGbLAAW', Name: 'Summit Corp', Industry: 'Financial', Type: 'Customer', Website: 'https://summit.co' },
        { Id: '001xx000003DGbMAAW', Name: 'Evergreen Solutions', Industry: 'Energy', Type: 'Partner', Website: 'https://evergreen.io' },
      ];
    } else if (isOpportunityQuery) {
      return [
        { Id: '006xx000004DGcNAAW', Name: 'New Software Implementation', Amount: 150000, StageName: 'Negotiation', CloseDate: '2023-12-15' },
        { Id: '006xx000004DGcOAAW', Name: 'Service Contract Renewal', Amount: 75000, StageName: 'Closed Won', CloseDate: '2023-10-30' },
        { Id: '006xx000004DGcPAAW', Name: 'Enterprise License', Amount: 250000, StageName: 'Proposal', CloseDate: '2023-11-15' },
        { Id: '006xx000004DGcQAAW', Name: 'Hardware Upgrade', Amount: 45000, StageName: 'Qualification', CloseDate: '2024-01-20' },
      ];
    } else if (isContactQuery) {
      return [
        { Id: '003xx000005DGdRAAW', FirstName: 'John', LastName: 'Smith', Email: 'john.smith@example.com', Phone: '(555) 123-4567' },
        { Id: '003xx000005DGdSAAW', FirstName: 'Jane', LastName: 'Doe', Email: 'jane.doe@example.com', Phone: '(555) 987-6543' },
        { Id: '003xx000005DGdTAAW', FirstName: 'Robert', LastName: 'Johnson', Email: 'robert.johnson@example.com', Phone: '(555) 246-8101' },
        { Id: '003xx000005DGdUAAW', FirstName: 'Emily', LastName: 'Williams', Email: 'emily.williams@example.com', Phone: '(555) 369-1478' },
        { Id: '003xx000005DGdVAAW', FirstName: 'Michael', LastName: 'Brown', Email: 'michael.brown@example.com', Phone: '(555) 741-8521' },
      ];
    } else {
      // Default mock data
      return [
        { Id: 'mock1', Name: 'Mock Record 1' },
        { Id: 'mock2', Name: 'Mock Record 2' },
        { Id: 'mock3', Name: 'Mock Record 3' },
      ];
    }
  };
  
  // Handle query generation from AI assistant
  const handleQueryGenerated = (generatedQuery: string) => {
    setQuery(generatedQuery);
    if (mode === 'builder') {
      setMode('editor');
    }
  };
  
  // Handle query from builder to editor
  const handleQueryFromBuilder = (builderQuery: string) => {
    setQuery(builderQuery);
  };
  
  // Visualize query in builder
  const visualizeQueryInBuilder = (queryToVisualize: string) => {
    // TODO: Parse the query and set the builder state
    // This would require a SOQL parser, which is beyond the scope of this example
    setMode('builder');
    toast({
      title: 'Query Visualization',
      description: 'SOQL query parsing and visualization is not fully implemented in this demo.',
    });
  };
  
  // Render results table
  const renderResultsTable = () => {
    if (!queryResults || queryResults.length === 0) {
      return (
        <div className="p-6 text-center text-muted-foreground">
          No results to display. Please execute a query.
        </div>
      );
    }
    
    const columns = Object.keys(queryResults[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              {columns.map((column) => (
                <th key={column} className="p-2 text-left border text-sm font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queryResults.map((record, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                {columns.map((column) => (
                  <td key={`${index}-${column}`} className="p-2 border text-sm">
                    {record[column] !== null && record[column] !== undefined
                      ? String(record[column])
                      : <span className="text-muted-foreground italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">SOQL Editor</h1>
        <div className="flex items-center gap-4">
          <AiQueryAssistant 
            metadata={mockSalesforceMetadata}
            onQueryGenerated={handleQueryGenerated}
            onVisualize={visualizeQueryInBuilder}
          />
          <div className="border-l h-6"></div>
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'editor' | 'builder')}>
            <TabsList>
              <TabsTrigger value="editor">Editor Mode</TabsTrigger>
              <TabsTrigger value="builder">Drag & Drop</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">
              Write, optimize, and execute Salesforce queries
            </p>
            
            <div className="mb-6">
              <Tabs value={mode} className="w-full">
                <TabsContent value="editor" className="mt-0">
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your SOQL query here..."
                    className="font-mono min-h-[200px]"
                  />
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={() => executeQuery()}
                      disabled={isExecuting || !query.trim()}
                    >
                      {isExecuting ? 'Executing...' : 'Run Query'}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="builder" className="mt-0">
                  <div className="border rounded-md">
                    <QueryCanvas onExecuteQuery={(builderQuery) => {
                      handleQueryFromBuilder(builderQuery);
                      executeQuery(builderQuery);
                    }} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Query Results</h2>
              {renderResultsTable()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}