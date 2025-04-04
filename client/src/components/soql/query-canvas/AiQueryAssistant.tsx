import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AiQueryAssistantProps {
  metadata: any;
  onQueryGenerated: (query: string) => void;
  onVisualize?: (query: string) => void;
}

export default function AiQueryAssistant({ metadata, onQueryGenerated, onVisualize }: AiQueryAssistantProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedQuery, setGeneratedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate query using AI
  const generateQuery = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Simplified mock response for demonstration
      // In a real implementation, this would make an API call to OpenAI/GPT
      
      // For the mock, we'll create a realistic SOQL response based on the prompt
      const mockResponse = getMockResponse(prompt);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGeneratedQuery(mockResponse);
    } catch (error) {
      console.error('Error generating query:', error);
      toast({
        title: 'Generation Failed',
        description: 'There was an error generating the query. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get a mock response based on the prompt
  const getMockResponse = (prompt: string) => {
    prompt = prompt.toLowerCase();
    
    if (prompt.includes('account') && prompt.includes('contact')) {
      return `SELECT Id, Name, Industry, Type, 
(SELECT Id, FirstName, LastName, Email, Phone FROM Contacts WHERE IsActive = true)
FROM Account 
WHERE Industry != null 
ORDER BY Name ASC
LIMIT 100`;
    } else if (prompt.includes('opportunity') && prompt.includes('amount')) {
      return `SELECT Id, Name, Amount, StageName, CloseDate, 
(SELECT Id, Name, UnitPrice, Quantity FROM OpportunityLineItems)
FROM Opportunity 
WHERE Amount > 100000 AND CloseDate = THIS_YEAR
ORDER BY Amount DESC
LIMIT 50`;
    } else if (prompt.includes('owner') && prompt.includes('typeof')) {
      return `SELECT Id, Name, 
TYPEOF Owner WHEN User THEN FirstName, LastName, Email WHEN Group THEN Name, Type END
FROM Account
WHERE CreatedDate > LAST_YEAR
LIMIT 200`;
    } else {
      return `SELECT Id, Name, Type, Industry, Phone, Website 
FROM Account 
WHERE Industry != null AND IsActive = true
ORDER BY CreatedDate DESC
LIMIT 100`;
    }
  };
  
  // Handle inserting query
  const handleInsertQuery = () => {
    onQueryGenerated(generatedQuery);
    setIsOpen(false);
    resetForm();
  };
  
  // Handle visualizing query
  const handleVisualizeQuery = () => {
    if (onVisualize) {
      onVisualize(generatedQuery);
      setIsOpen(false);
      resetForm();
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setPrompt('');
    setGeneratedQuery('');
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <BrainCircuit className="w-4 h-4" />
        Ask AI to Write My Query
      </Button>
      
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Query Assistant</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe what you'd like to query...</label>
              <Textarea
                placeholder="E.g. Show me all accounts with related contacts where the industry is not null"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            
            {!generatedQuery ? (
              <Button
                onClick={generateQuery}
                disabled={!prompt.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Generate Query'}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="font-medium text-sm">Generated SOQL Query:</div>
                <pre className="p-4 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                  {generatedQuery}
                </pre>
              </div>
            )}
          </div>
          
          {generatedQuery && (
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              {onVisualize && (
                <Button variant="secondary" onClick={handleVisualizeQuery}>
                  Visualize in Builder Mode
                </Button>
              )}
              <Button onClick={handleInsertQuery}>
                Insert into Editor Mode
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}