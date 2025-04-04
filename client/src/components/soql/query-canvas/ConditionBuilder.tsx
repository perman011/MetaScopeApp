import React, { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Plus, 
  PlusCircle, 
  MinusCircle, 
  ChevronRight, 
  ChevronsRight,
  MoveHorizontal,
  Parentheses,
  Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Types
export type FilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'INCLUDES' | 'EXCLUDES';
export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
  logicalOperator?: LogicalOperator;
  // For nested conditions
  isGroup?: boolean;
  conditions?: FilterCondition[];
}

export interface ConditionBuilderProps {
  metadata: any;
  selectedObject: string;
  conditions: FilterCondition[];
  onChange: (conditions: FilterCondition[]) => void;
  parentCondition?: FilterCondition;
  isNested?: boolean;
  level?: number;
}

export default function ConditionBuilder({
  metadata,
  selectedObject,
  conditions,
  onChange,
  parentCondition,
  isNested = false,
  level = 0
}: ConditionBuilderProps) {
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [newField, setNewField] = useState<string>('');
  const [newOperator, setNewOperator] = useState<FilterOperator>('=');
  const [newValue, setNewValue] = useState<string>('');
  const [newLogicalOperator, setNewLogicalOperator] = useState<LogicalOperator>('AND');
  const [activeConditionId, setActiveConditionId] = useState<string | null>(null);
  
  // Generate a unique ID for conditions
  const generateId = () => Math.random().toString(36).substring(2, 11);
  
  // Get the selected object's fields
  const getObjectFields = () => {
    if (!metadata || !selectedObject) return [];
    const obj = metadata.objects.find((o: any) => o.name === selectedObject);
    return obj?.fields || [];
  };
  
  // Get operators based on field type
  const getOperators = (fieldName: string): FilterOperator[] => {
    if (!fieldName) return ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'NOT IN', 'INCLUDES', 'EXCLUDES'];
    
    const selectedField = getObjectFields().find((f: any) => f.name === fieldName);
    const fieldType = selectedField?.type || 'string';
    
    switch (fieldType) {
      case 'boolean':
        return ['=', '!='];
      case 'integer':
      case 'double':
      case 'date':
      case 'datetime':
        return ['=', '!=', '>', '<', '>=', '<='];
      case 'picklist':
      case 'multipicklist':
        return ['=', '!=', 'IN', 'NOT IN', 'INCLUDES', 'EXCLUDES'];
      case 'reference':
        return ['=', '!=', 'IN', 'NOT IN'];
      default:
        return ['=', '!=', 'LIKE', 'IN', 'NOT IN'];
    }
  };
  
  // Get field type 
  const getFieldType = (fieldName: string) => {
    if (!fieldName) return 'string';
    const selectedField = getObjectFields().find((f: any) => f.name === fieldName);
    return selectedField?.type || 'string';
  };
  
  // Format value based on field type and operator
  const formatValue = (fieldName: string, operator: FilterOperator, rawValue: string) => {
    const fieldType = getFieldType(fieldName);
    
    if (['IN', 'NOT IN'].includes(operator)) {
      // For IN operators, wrap in parentheses and split by comma
      const values = rawValue.split(',').map(v => v.trim());
      
      if (fieldType === 'string' || fieldType === 'id' || fieldType === 'reference') {
        return `(${values.map(v => `'${v}'`).join(', ')})`;
      } else {
        return `(${values.join(', ')})`;
      }
    } else if (fieldType === 'string' || fieldType === 'id' || fieldType === 'reference' || fieldType === 'picklist') {
      // For string types, wrap in quotes
      return `'${rawValue}'`;
    } else if (fieldType === 'date') {
      // For date, use special format or leave as is if it's a date literal
      if (rawValue.startsWith('THIS_') || rawValue.startsWith('LAST_') || rawValue.startsWith('NEXT_')) {
        return rawValue;
      } else {
        return rawValue; // In a full implementation, this would format the date properly
      }
    } else if (fieldType === 'boolean') {
      // For boolean, lowercase
      return rawValue.toLowerCase();
    } else {
      // For other types (number, etc), leave as is
      return rawValue;
    }
  };
  
  // Get placeholder text based on field type and operator
  const getValuePlaceholder = (fieldName: string, operator: FilterOperator) => {
    const fieldType = getFieldType(fieldName);
    
    if (['IN', 'NOT IN'].includes(operator)) {
      return 'Enter comma-separated values';
    } else if (fieldType === 'date') {
      return 'YYYY-MM-DD or THIS_WEEK, LAST_MONTH, etc.';
    } else if (fieldType === 'boolean') {
      return 'true or false';
    } else if (fieldType === 'picklist') {
      return 'Enter picklist value';
    } else {
      return 'Enter value';
    }
  };
  
  // Handle adding a simple condition
  const handleAddCondition = () => {
    if (!newField || !newOperator || !newValue) return;
    
    const newCondition: FilterCondition = {
      id: generateId(),
      field: newField,
      operator: newOperator,
      value: formatValue(newField, newOperator, newValue),
      logicalOperator: conditions.length > 0 ? newLogicalOperator : undefined
    };
    
    onChange([...conditions, newCondition]);
    
    // Reset form
    setNewField('');
    setNewOperator('=');
    setNewValue('');
    setIsAddingCondition(false);
  };
  
  // Handle adding a condition group
  const handleAddGroup = () => {
    const newGroup: FilterCondition = {
      id: generateId(),
      field: '',
      operator: '=' as FilterOperator,
      value: '',
      isGroup: true,
      conditions: [],
      logicalOperator: conditions.length > 0 ? newLogicalOperator : undefined
    };
    
    onChange([...conditions, newGroup]);
  };
  
  // Handle removing a condition
  const handleRemoveCondition = (idToRemove: string) => {
    onChange(conditions.filter(condition => condition.id !== idToRemove));
  };
  
  // Handle updating a nested group's conditions
  const handleUpdateNestedConditions = (conditionId: string, updatedNestedConditions: FilterCondition[]) => {
    onChange(
      conditions.map(condition => {
        if (condition.id === conditionId) {
          return {
            ...condition,
            conditions: updatedNestedConditions
          };
        }
        return condition;
      })
    );
  };
  
  // Handle changing a condition's logical operator
  const handleChangeLogicalOperator = (conditionId: string, newOperator: LogicalOperator) => {
    onChange(
      conditions.map(condition => {
        if (condition.id === conditionId) {
          return {
            ...condition,
            logicalOperator: newOperator
          };
        }
        return condition;
      })
    );
  };
  
  return (
    <div className={cn("space-y-4", isNested && "pl-4 border-l-2 border-dashed border-muted")}>
      {/* Existing conditions */}
      {conditions.length > 0 ? (
        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="space-y-2">
              {/* Logical operator for conditions after the first one */}
              {index > 0 && (
                <div className="flex items-center gap-2 py-1">
                  <Badge variant="outline" className="text-xs">
                    {condition.logicalOperator || 'AND'}
                  </Badge>
                  <Select 
                    value={condition.logicalOperator || 'AND'} 
                    onValueChange={(value) => handleChangeLogicalOperator(condition.id, value as LogicalOperator)}
                  >
                    <SelectTrigger className="w-20 h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                      <SelectItem value="NOT">NOT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Condition or group */}
              {condition.isGroup ? (
                <Card className="relative">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <Badge className="bg-primary/10 hover:bg-primary/20 text-primary">
                        <Parentheses className="h-3 w-3 mr-1" />
                        Condition Group
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveCondition(condition.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <ConditionBuilder
                      metadata={metadata}
                      selectedObject={selectedObject}
                      conditions={condition.conditions || []}
                      onChange={(updatedConditions) => handleUpdateNestedConditions(condition.id, updatedConditions)}
                      parentCondition={condition}
                      isNested={true}
                      level={level + 1}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div 
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-md",
                    activeConditionId === condition.id ? "ring-2 ring-primary" : "",
                    "hover:bg-accent/50 transition-colors"
                  )}
                  onClick={() => setActiveConditionId(condition.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{condition.field}</span>
                    <span className="text-muted-foreground">{condition.operator}</span>
                    <span>{condition.value}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCondition(condition.id)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground p-3 border rounded-md border-dashed text-sm">
          No conditions added. Add a condition or group to filter records.
        </div>
      )}
      
      {/* Controls for adding new conditions */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={isAddingCondition} onOpenChange={setIsAddingCondition}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Add Condition
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Filter Condition</DialogTitle>
              <DialogDescription>
                Create a condition to filter records based on field values.
              </DialogDescription>
            </DialogHeader>
            
            {conditions.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium block mb-2">Logical Operator</label>
                <Select value={newLogicalOperator} onValueChange={(value) => setNewLogicalOperator(value as LogicalOperator)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                    <SelectItem value="NOT">NOT</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  How this condition connects with previous conditions
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Field</label>
                <Select value={newField} onValueChange={setNewField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {getObjectFields().map((f: any) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">Operator</label>
                <Select 
                  value={newOperator} 
                  onValueChange={(value) => setNewOperator(value as FilterOperator)}
                  disabled={!newField}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOperators(newField).map(op => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">Value</label>
                <Input
                  placeholder={getValuePlaceholder(newField, newOperator)}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  disabled={!newField || !newOperator}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {['IN', 'NOT IN'].includes(newOperator) 
                    ? "For multiple values, separate with commas" 
                    : "Enter the value to compare against"}
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleAddCondition}
                disabled={!newField || !newOperator || !newValue}
              >
                Add Condition
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-1"
          onClick={handleAddGroup}
        >
          <Parentheses className="h-4 w-4" />
          Add Group
        </Button>
      </div>
    </div>
  );
}