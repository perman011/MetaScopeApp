import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react';

interface FromSelectorProps {
  metadata: any;
  selectedObject: string;
  onObjectSelected: (objectName: string) => void;
}

export default function FromSelector({
  metadata,
  selectedObject,
  onObjectSelected
}: FromSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter objects based on search term
  const filteredObjects = metadata?.objects?.filter((obj: any) => 
    obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obj.label.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search objects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      <Select value={selectedObject} onValueChange={onObjectSelected}>
        <SelectTrigger>
          <SelectValue placeholder="Select Salesforce object" />
        </SelectTrigger>
        <SelectContent>
          {filteredObjects.map((obj: any) => (
            <SelectItem key={obj.name} value={obj.name}>
              {obj.label} ({obj.name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedObject && (
        <div className="text-sm text-muted-foreground">
          Selected object: <span className="font-medium text-foreground">{selectedObject}</span>
        </div>
      )}
    </div>
  );
}