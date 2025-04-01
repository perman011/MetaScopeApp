import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Lightbulb, Loader2 } from 'lucide-react';

interface AiModel {
  id: string;
  name: string;
  provider: string;
  color: string;
}

interface AiAssistantProps {
  query: string;
  onQueryUpdate: (newQuery: string) => void;
  trigger?: React.ReactNode;
}

export default function AiAssistant({ query, onQueryUpdate, trigger }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o");
  const [prompt, setPrompt] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Available AI models
  const models: AiModel[] = [
    { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", color: "green" },
    { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic", color: "blue" },
    { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "Anthropic", color: "blue" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google", color: "red" },
    { id: "mistral-large", name: "Le Chat (Mistral Large)", provider: "Mistral", color: "purple" },
    { id: "deepseek-coder", name: "DeepSeek Coder", provider: "DeepSeek", color: "cyan" },
    { id: "grok-1", name: "Grok-1", provider: "xAI", color: "yellow" },
  ];

  // Generate sample prompts based on the current query
  const samplePrompts = [
    "Optimize this query for better performance",
    "Explain this query in simple terms",
    "Modify this query to include related records",
    "Convert this query to a more efficient form",
    "Help me understand why this query isn't returning results",
    "Add comments to explain each part of this query"
  ];

  // Handle model selection
  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
  };

  // Handle prompt selection from examples
  const handlePromptSelect = (samplePrompt: string) => {
    setPrompt(samplePrompt);
  };

  // Mock AI assistant request (in a real app, this would call an API endpoint)
  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setResponse(""); // Clear previous response
    
    try {
      // Simulate API call to LLM
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a mock response based on the selected model and prompt
      const selectedModelInfo = models.find(m => m.id === selectedModel);
      let mockResponse = "";
      
      if (prompt.includes("optimize") || prompt.includes("performance")) {
        mockResponse = `Here's an optimized version of your query:\n\n\`\`\`sql\n${
          query
            .replace(/SELECT (.*?) FROM/i, "SELECT Id, Name, Type, Industry FROM")
            .replace(/LIMIT \d+/i, "LIMIT 100")
        }\n\`\`\`\n\nOptimizations applied:\n1. Limited field selection to only what's needed\n2. Set appropriate LIMIT to prevent large data sets\n3. Ensured proper field indexing`;
      } else if (prompt.includes("explain")) {
        mockResponse = `This query is retrieving Account records. Here's a breakdown:\n\n- It selects the following fields: Id, Name, AccountNumber, Type, Industry, AnnualRevenue\n- It's retrieving these fields from the Account object\n- It filters to only include accounts with annual revenue over $1,000,000\n- Results are ordered by AnnualRevenue in descending order (highest first)\n- It will return a maximum of 10 records`;
      } else if (prompt.includes("related records")) {
        mockResponse = `Here's a modified query that includes related Contact records:\n\n\`\`\`sql\nSELECT Id, Name, AccountNumber, Type, Industry, AnnualRevenue,\n    (SELECT Id, FirstName, LastName, Email FROM Contacts)\nFROM Account\nWHERE AnnualRevenue > 1000000\nORDER BY AnnualRevenue DESC\nLIMIT 10\n\`\`\`\n\nThis uses a subquery to fetch related Contact records for each Account.`;
      } else {
        mockResponse = `Based on your query, I suggest:\n\n\`\`\`sql\nSELECT Id, Name, AccountNumber, Type, Industry, AnnualRevenue,\n    Owner.Name, CreatedDate\nFROM Account\nWHERE AnnualRevenue > 1000000\n    AND CreatedDate = LAST_N_DAYS:365\nORDER BY AnnualRevenue DESC\nLIMIT 10\n\`\`\`\n\nThis enhances your query by adding the Account Owner's name and filtering to accounts created in the last year.`;
      }
      
      // Simulate typing effect
      const words = mockResponse.split(' ');
      let currentResponse = '';
      
      for (const word of words) {
        currentResponse += word + ' ';
        setResponse(currentResponse);
        await new Promise(resolve => setTimeout(resolve, 20)); // Adjust speed as needed
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      setResponse("Sorry, there was an error generating a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply the AI suggestion to update the query
  const applyAiSuggestion = () => {
    // Extract code blocks surrounded by ```sql and ```
    const codeBlockRegex = /```sql\n([\s\S]*?)```/;
    const match = response.match(codeBlockRegex);
    
    if (match && match[1]) {
      // Update the query with the extracted SQL code
      onQueryUpdate(match[1].trim());
      setIsOpen(false);
    } else {
      // If no code block is found, do nothing
      console.log("No SQL code block found in the AI response");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-neutral-700 hover:bg-neutral-600 rounded-full">
            <Lightbulb className="h-4 w-4 text-yellow-300" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI SOQL Assistant</DialogTitle>
          <DialogDescription>
            Get help writing, optimizing, or understanding SOQL queries
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Model selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="ai-model" className="text-sm font-medium col-span-1">
              AI Model
            </label>
            <div className="col-span-3">
              <Select value={selectedModel} onValueChange={handleModelSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center">
                        <span 
                          className={`w-2 h-2 rounded-full mr-2 bg-${model.color}-500`}
                          style={{ backgroundColor: `var(--${model.color}-500, #10b981)` }}
                        ></span>
                        {model.name} ({model.provider})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Current query */}
          <div className="border p-3 rounded-md bg-neutral-50 text-sm font-mono overflow-auto max-h-32">
            {query || <span className="text-neutral-400">No query to analyze</span>}
          </div>
          
          {/* Prompt */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="prompt" className="text-sm font-medium">
                What do you want to do with this query?
              </label>
              <div className="text-xs text-neutral-500">
                {prompt.length}/200
              </div>
            </div>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Optimize this query for better performance"
              className="resize-none h-20"
              maxLength={200}
            />
            
            {/* Sample prompts */}
            <div className="mt-2 flex flex-wrap gap-2">
              {samplePrompts.map((sample, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromptSelect(sample)}
                  className="text-xs h-7"
                >
                  {sample}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Response */}
          {(isLoading || response) && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-1">Response</div>
              <div className="border p-4 rounded-md bg-neutral-50 min-h-32 max-h-72 overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600 mr-2" />
                    <span className="text-neutral-600">Generating response...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm">
                    {response.split('```sql').map((part, i) => {
                      if (i === 0) return <div key={i}>{part}</div>;
                      
                      const [code, ...rest] = part.split('```');
                      return (
                        <div key={i}>
                          <div className="bg-neutral-800 text-white p-3 my-2 rounded-md font-mono text-sm overflow-x-auto">
                            {code}
                          </div>
                          {rest.join('```')}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <div className="text-xs text-neutral-500">
            *This is a demonstration - AI models are not actually connected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {!response ? (
              <Button onClick={handleSubmit} disabled={!prompt.trim() || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            ) : (
              <Button onClick={applyAiSuggestion}>
                Apply Suggestion
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}