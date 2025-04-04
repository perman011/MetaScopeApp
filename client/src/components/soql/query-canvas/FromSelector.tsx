import React, { useState } from 'react';
import { Check, ChevronsUpDown, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SalesforceObject {
  name: string;
  label: string;
}

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
  const [open, setOpen] = useState(false);
  
  // Get all objects from metadata
  const objects: SalesforceObject[] = metadata?.objects || [];
  
  // Find the selected object details
  const selectedObjectDetails = selectedObject 
    ? objects.find(obj => obj.name === selectedObject) 
    : undefined;
  
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedObject ? (
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 opacity-70" />
                <span>{selectedObjectDetails?.label || selectedObject}</span>
                <span className="text-xs opacity-70">({selectedObject})</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Search and select Salesforce object</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full min-w-[300px]">
          <Command>
            <CommandInput placeholder="Search Salesforce objects..." />
            <CommandList>
              <CommandEmpty>No objects found.</CommandEmpty>
              <CommandGroup heading="Salesforce Objects" className="max-h-[300px] overflow-y-auto">
                {objects.map((obj) => (
                  <CommandItem
                    key={obj.name}
                    value={obj.name}
                    onSelect={() => {
                      onObjectSelected(obj.name);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 opacity-70" />
                      <span>{obj.label}</span>
                      <span className="text-xs opacity-70">({obj.name})</span>
                    </div>
                    {selectedObject === obj.name && (
                      <Check className="h-4 w-4 opacity-70" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedObject && (
        <div className="text-sm text-muted-foreground">
          Selected object: <span className="font-medium text-foreground">{selectedObjectDetails?.label || selectedObject}</span>
        </div>
      )}
    </div>
  );
}