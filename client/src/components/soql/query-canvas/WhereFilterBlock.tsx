import React, { useState, useEffect } from 'react';
import ConditionBuilder, { FilterCondition, LogicalOperator } from './ConditionBuilder';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WhereFilterBlockProps {
  metadata: any;
  selectedObject: string;
  filterConditions: FilterCondition[];
  onAddFilterCondition: (condition: FilterCondition) => void;
  onRemoveFilterCondition: (index: number) => void;
  // New prop for advanced mode
  onUpdateFilterConditions: (conditions: FilterCondition[]) => void;
}

export default function WhereFilterBlock({
  metadata,
  selectedObject,
  filterConditions,
  onAddFilterCondition,
  onRemoveFilterCondition,
  onUpdateFilterConditions
}: WhereFilterBlockProps) {
  // State for advanced condition builder
  const [advancedConditions, setAdvancedConditions] = useState<FilterCondition[]>([]);
  
  // Initialize advanced conditions from filter conditions
  useEffect(() => {
    if (filterConditions.length > 0 && advancedConditions.length === 0) {
      // Convert simple conditions to the advanced format
      const converted = filterConditions.map((condition, index) => ({
        id: condition.id || `existing-${index}`,
        field: condition.field,
        operator: condition.operator as any,
        value: condition.value,
        logicalOperator: index > 0 ? ('AND' as LogicalOperator) : undefined
      }));
      
      setAdvancedConditions(converted);
    }
  }, [filterConditions]);
  
  // Handle changes in the advanced conditions
  const handleConditionsChange = (newConditions: FilterCondition[]) => {
    setAdvancedConditions(newConditions);
    onUpdateFilterConditions(newConditions);
  };
  
  // Format condition clauses for display
  const formatConditionForDisplay = (condition: FilterCondition, level = 0): string => {
    if (condition.isGroup && condition.conditions) {
      const nestedConditions = condition.conditions.map(c => formatConditionForDisplay(c, level + 1)).join(' ');
      return `(${nestedConditions})`;
    } else {
      let prefix = condition.logicalOperator ? `${condition.logicalOperator} ` : '';
      return `${prefix}${condition.field} ${condition.operator} ${condition.value}`;
    }
  };
  
  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Visual Filter Builder</AlertTitle>
        <AlertDescription>
          Build complex WHERE clauses with logical operators (AND, OR, NOT) and nested condition groups.
        </AlertDescription>
      </Alert>
      
      <ConditionBuilder
        metadata={metadata}
        selectedObject={selectedObject}
        conditions={advancedConditions}
        onChange={handleConditionsChange}
      />
    </div>
  );
}