import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import AiAssistant from './ai-assistant';

interface SuggestionType {
  value: string;
  description: string;
  type: 'keyword' | 'function' | 'field' | 'object';
}

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export default function QueryEditor({ value, onChange, isLoading = false }: QueryEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<SuggestionType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Base suggestions for intellisense
  const baseSuggestions: SuggestionType[] = [
    { value: 'SELECT', description: 'Start a query to retrieve fields', type: 'keyword' },
    { value: 'FROM', description: 'Specify the object to query', type: 'keyword' },
    { value: 'WHERE', description: 'Add filter conditions', type: 'keyword' },
    { value: 'ORDER BY', description: 'Sort the results', type: 'keyword' },
    { value: 'GROUP BY', description: 'Group results by field', type: 'keyword' },
    { value: 'LIMIT', description: 'Limit the number of results', type: 'keyword' },
    { value: 'OFFSET', description: 'Skip a number of results', type: 'keyword' },
    { value: 'COUNT()', description: 'Count records', type: 'function' },
    { value: 'AVG()', description: 'Calculate average', type: 'function' },
    { value: 'SUM()', description: 'Calculate sum', type: 'function' },
    { value: 'MAX()', description: 'Find maximum value', type: 'function' },
    { value: 'MIN()', description: 'Find minimum value', type: 'function' },
    // Common objects
    { value: 'Account', description: 'Standard account object', type: 'object' },
    { value: 'Contact', description: 'Standard contact object', type: 'object' },
    { value: 'Opportunity', description: 'Standard opportunity object', type: 'object' },
    { value: 'Lead', description: 'Standard lead object', type: 'object' },
    { value: 'Case', description: 'Standard case object', type: 'object' },
    // Common fields
    { value: 'Id', description: 'Record ID field', type: 'field' },
    { value: 'Name', description: 'Name field', type: 'field' },
    { value: 'CreatedDate', description: 'Record creation date', type: 'field' },
    { value: 'LastModifiedDate', description: 'Last modification date', type: 'field' },
    { value: 'OwnerId', description: 'Record owner ID', type: 'field' },
  ];

  // Update line numbers when value changes
  useEffect(() => {
    if (value) {
      const lines = value.split('\n');
      const numbers = lines.map((_, i) => (i + 1).toString());
      setLineNumbers(numbers);
    } else {
      setLineNumbers(['1']);
    }
  }, [value]);

  // Adjust height of textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  // Handle intellisense suggestions based on cursor position and text
  const updateSuggestions = (text: string, position: number) => {
    // Get current word being typed
    const textBeforeCursor = text.substring(0, position);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1].trim();
    
    if (currentWord.length < 1) {
      setShowSuggestions(false);
      return;
    }
    
    // Filter suggestions based on current word
    const filtered = baseSuggestions.filter(suggestion => 
      suggestion.value.toLowerCase().includes(currentWord.toLowerCase())
    );
    
    // Update suggestions
    if (filtered.length > 0) {
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Apply selected suggestion
  const applySuggestion = (suggestion: SuggestionType) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const lastWord = words[words.length - 1].trim();
    
    // Replace the current word with the suggestion
    const beforeLastWord = textBeforeCursor.substring(0, textBeforeCursor.length - lastWord.length);
    const afterCursor = value.substring(cursorPosition);
    
    const newValue = beforeLastWord + suggestion.value + afterCursor;
    onChange(newValue);
    
    // Close suggestions
    setShowSuggestions(false);
  };

  // Handle key events for editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const { key } = e;
    const { selectionStart, selectionEnd } = e.currentTarget;

    // Update cursor position for suggestions
    setCursorPosition(selectionStart);
    
    // Handle Tab key to insert spaces
    if (key === 'Tab') {
      e.preventDefault();
      const newValue = value.substring(0, selectionStart) + '    ' + value.substring(selectionEnd);
      onChange(newValue);
      
      // Set cursor position after the inserted tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = selectionStart + 4;
          textareaRef.current.selectionEnd = selectionStart + 4;
        }
      }, 0);
    } 
    // Handle escape key to close suggestions
    else if (key === 'Escape') {
      setShowSuggestions(false);
    }
    // Update intellisense suggestions on key press
    else {
      setTimeout(() => {
        updateSuggestions(e.currentTarget.value, e.currentTarget.selectionStart);
      }, 0);
    }
  };

  // Handle cursor position changes for intellisense
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
      updateSuggestions(value, textareaRef.current.selectionStart);
    }
  };

  // Show loading overlay when query is executing
  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10 backdrop-blur-sm">
      <div className="bg-white rounded-md shadow-md p-4 flex items-center space-x-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="text-neutral-800 font-medium">Executing query...</span>
      </div>
    </div>
  );

  return (
    <div className="relative border rounded-md overflow-hidden">
      {isLoading && <LoadingOverlay />}
      
      <div className="flex">
        {/* Line numbers */}
        <div className="py-3 px-2 bg-neutral-800 text-neutral-500 text-right select-none w-10 font-mono text-sm">
          {lineNumbers.map((num, i) => (
            <div key={i}>{num}</div>
          ))}
        </div>
        
        {/* Editor */}
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            className="w-full py-3 px-4 min-h-[200px] resize-none font-mono text-sm bg-neutral-800 text-white border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
            placeholder="Enter your SOQL query here..."
            spellCheck={false}
          />
          
          {/* Intellisense suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 mt-1 w-full max-w-xs z-50 bg-white rounded-md shadow-lg border border-neutral-200 max-h-60 overflow-y-auto">
              <ul className="py-1">
                {suggestions.map((suggestion, index) => (
                  <li 
                    key={index} 
                    className="px-3 py-2 hover:bg-neutral-100 cursor-pointer flex items-center"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                      suggestion.type === 'keyword' ? 'bg-purple-500' :
                      suggestion.type === 'function' ? 'bg-blue-500' :
                      suggestion.type === 'object' ? 'bg-green-500' : 'bg-orange-500'
                    }`}></span>
                    <span className="font-medium">{suggestion.value}</span>
                    <span className="ml-2 text-xs text-neutral-500">{suggestion.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Syntax hints */}
      <div className="absolute bottom-2 right-16">
        <div className="text-xs text-neutral-400 bg-neutral-900 px-2 py-1 rounded opacity-80">
          Press Tab to indent
        </div>
      </div>
      
      {/* AI Assistant button */}
      <div className="absolute bottom-2 right-2">
        <AiAssistant 
          query={value} 
          onQueryUpdate={onChange} 
        />
      </div>
    </div>
  );
}
