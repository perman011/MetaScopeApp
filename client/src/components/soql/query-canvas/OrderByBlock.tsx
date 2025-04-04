import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, ArrowDown, ArrowUp } from 'lucide-react';
import { SortItem } from './QueryCanvas';
import { Badge } from '@/components/ui/badge';

interface OrderByBlockProps {
  metadata: any;
  selectedObject: string;
  sortItems: SortItem[];
  onAddSortItem: (sort: SortItem) => void;
  onRemoveSortItem: (index: number) => void;
}

export default function OrderByBlock({
  metadata,
  selectedObject,
  sortItems,
  onAddSortItem,
  onRemoveSortItem
}: OrderByBlockProps) {
  const [field, setField] = useState('');
  const [direction, setDirection] = useState<'ASC' | 'DESC'>('ASC');
  
  // Get selected object details
  const getSelectedObjectDetails = () => {
    if (!metadata || !selectedObject) return null;
    return metadata.objects.find((obj: any) => obj.name === selectedObject);
  };
  
  // Handle sort item add
  const handleAddSortItem = () => {
    if (field) {
      onAddSortItem({
        field,
        direction
      });
      setField('');
      setDirection('ASC');
    }
  };
  
  const objectDetails = getSelectedObjectDetails();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Select value={field} onValueChange={setField}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            {objectDetails?.fields.map((f: any) => (
              <SelectItem key={f.name} value={f.name}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={direction} onValueChange={(value: 'ASC' | 'DESC') => setDirection(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASC">Ascending</SelectItem>
            <SelectItem value="DESC">Descending</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={handleAddSortItem} disabled={!field}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      
      {sortItems.length > 0 ? (
        <div className="space-y-2">
          {sortItems.map((sort, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{sort.field}</Badge>
                {sort.direction === 'ASC' ? (
                  <ArrowUp className="h-4 w-4 text-primary" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-primary" />
                )}
                <span className="text-sm">{sort.direction === 'ASC' ? 'Ascending' : 'Descending'}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveSortItem(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground">No sorting added yet</div>
      )}
      
      {sortItems.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Items are applied in the order shown (top to bottom)
        </div>
      )}
    </div>
  );
}