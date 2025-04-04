import React from 'react';

interface QueryPreviewProps {
  query: string;
}

export default function QueryPreview({ query }: QueryPreviewProps) {
  if (!query) {
    return (
      <div className="p-4 bg-muted rounded-md">
        <div className="text-muted-foreground text-center">
          Query preview will appear here
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-muted rounded-md overflow-x-auto">
      <pre className="text-sm font-mono whitespace-pre-wrap">{query}</pre>
    </div>
  );
}