import React from 'react';
import { cn } from '@/lib/utils';

interface QueryPreviewProps {
  query: string;
}

export default function QueryPreview({ query }: QueryPreviewProps) {
  // Syntax highlighting function for SOQL
  const highlightSyntax = (query: string) => {
    if (!query) return '';
    
    // Split into lines for better processing
    const lines = query.split('\n');
    
    // Process each line
    const highlightedLines = lines.map((line) => {
      // Highlight SOQL keywords
      let highlighted = line
        .replace(/(SELECT|FROM|WHERE|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET)/gi, 
          match => `<span class="text-blue-500 font-semibold">${match}</span>`)
        .replace(/(AND|OR|NOT|LIKE|IN|NOT IN|INCLUDES|EXCLUDES)/gi, 
          match => `<span class="text-indigo-500 font-semibold">${match}</span>`)
        .replace(/('.*?')/g, 
          match => `<span class="text-green-600">${match}</span>`)
        .replace(/(\d+)/g, 
          match => `<span class="text-orange-500">${match}</span>`)
        .replace(/(ASC|DESC)/gi, 
          match => `<span class="text-purple-500 font-semibold">${match}</span>`)
        .replace(/(\w+\.\w+)/g, 
          match => `<span class="text-teal-600">${match}</span>`);
      
      return highlighted;
    });
    
    return highlightedLines.join('\n');
  };
  
  if (!query) {
    return (
      <div className="p-4 bg-muted/30 rounded-md border">
        <div className="text-muted-foreground text-center py-6">
          Query preview will appear here as you build your query
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "p-4 bg-muted/30 rounded-md border overflow-x-auto",
      "transition-all duration-200 hover:shadow-md hover:border-primary/20"
    )}>
      <pre 
        className="text-sm font-mono whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: highlightSyntax(query) }}
      />
    </div>
  );
}