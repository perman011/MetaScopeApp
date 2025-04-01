import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function QueryEditor({ value, onChange }: QueryEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState<string[]>([]);

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

  // Handle tab key to insert spaces instead of moving focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4;
          textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  return (
    <div className="relative border rounded-md overflow-hidden">
      <div className="flex">
        {/* Line numbers */}
        <div className="py-3 px-2 bg-neutral-800 text-neutral-500 text-right select-none w-10 font-mono text-sm">
          {lineNumbers.map((num, i) => (
            <div key={i}>{num}</div>
          ))}
        </div>
        
        {/* Editor */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 py-3 px-4 min-h-[150px] resize-none font-mono text-sm bg-neutral-800 text-white border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
          placeholder="Enter your SOQL query here..."
          spellCheck={false}
        />
      </div>
      
      {/* Syntax hints */}
      <div className="absolute bottom-2 right-2">
        <div className="text-xs text-neutral-400 bg-neutral-900 px-2 py-1 rounded opacity-80">
          Press Tab to indent
        </div>
      </div>
    </div>
  );
}
