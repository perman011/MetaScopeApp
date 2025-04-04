import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { FilterCondition } from './QueryCanvas';

interface WhereFilterBlockProps {
  metadata: any;
  selectedObject: string;
  filterConditions: FilterCondition[];
  onAddFilterCondition: (condition: FilterCondition) => void;
  onRemoveFilterCondition: (index: number) => void;
}

export default function WhereFilterBlock({
  metadata,
  selectedObject,
  filterConditions,
  onAddFilterCondition,
  onRemoveFilterCondition
}: WhereFilterBlockProps) {
  const [field, setField] = useState('');
  const [operator, setOperator] = useState('=');
  const [value, setValue] = useState('');
  
  // Get the selected object's fields
  const getObjectFields = () => {
    if (!metadata || !selectedObject) return [];
    const obj = metadata.objects.find((o: any) => o.name === selectedObject);
    return obj?.fields || [];
  };
  
  // Get operators based on field type
  const getOperators = () => {
    if (!field) return ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'NOT IN', 'INCLUDES', 'EXCLUDES'];
    
    const selectedField = getObjectFields().find((f: any) => f.name === field);
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
  const getFieldType = () => {
    if (!field) return 'string';
    const selectedField = getObjectFields().find((f: any) => f.name === field);
    return selectedField?.type || 'string';
  };
  
  // Format value based on field type and operator
  const formatValue = (rawValue: string) => {
    const fieldType = getFieldType();
    
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
  
  // Handle filter add
  const handleAddFilter = () => {
    if (field && operator && value) {
      onAddFilterCondition({
        field,
        operator,
        value: formatValue(value)
      });
      
      // Clear the form
      setField('');
      setOperator('=');
      setValue('');
    }
  };

  // Get placeholder text based on field type and operator
  const getValuePlaceholder = () => {
    const fieldType = getFieldType();
    
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
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <Select value={field} onValueChange={setField}>
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
          
          <Select 
            value={operator} 
            onValueChange={setOperator}
            disabled={!field}
          >
            <SelectTrigger>
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              {getOperators().map(op => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Input
              placeholder={getValuePlaceholder()}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!field || !operator}
              className="flex-1"
            />
            
            <Button 
              variant="outline" 
              onClick={handleAddFilter}
              disabled={!field || !operator || !value}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
      
      {filterConditions.length > 0 ? (
        <div className="space-y-2">
          {filterConditions.map((condition, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center gap-2">
                <span className="font-medium">{condition.field}</span>
                <span className="text-muted-foreground">{condition.operator}</span>
                <span>{condition.value}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveFilterCondition(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground">No filter conditions added yet</div>
      )}
      
      {filterConditions.length > 0 && (
        <div className="text-xs text-muted-foreground">
          All conditions are combined with AND logic
        </div>
      )}
    </div>
  );
}