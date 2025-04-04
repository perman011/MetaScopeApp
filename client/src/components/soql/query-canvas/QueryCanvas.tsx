import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import FromSelector from './FromSelector';
import SelectFields from './SelectFields';
import WhereFilterBlock from './WhereFilterBlock';
import OrderByBlock from './OrderByBlock';
import LimitBlock from './LimitBlock';
import QueryPreview from './QueryPreview';
import { Button } from '@/components/ui/button';
import { Play, Save, Code, Share, Copy } from 'lucide-react';
import { mockSalesforceMetadata } from '@/lib/mock-data';
import { FilterCondition as AdvancedFilterCondition } from './ConditionBuilder';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Types
export interface FieldSelection {
  apiName: string;
  relationshipName?: string;
  isRelationship?: boolean;
  parentObjectApiName?: string;
}

// Simple filter condition type (for backwards compatibility)
export interface FilterCondition {
  id?: string; // Made optional for backward compatibility
  field: string;
  operator: string;
  value: string;
}

export interface SortItem {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  query: string;
  createdAt: string;
  object: string;
}

interface QueryCanvasProps {
  onExecuteQuery: (query: string) => void;
}

export default function QueryCanvas({ onExecuteQuery }: QueryCanvasProps) {
  // State for selected object
  const [selectedObject, setSelectedObject] = useState<string>('');
  
  // State for selected fields
  const [selectedFields, setSelectedFields] = useState<FieldSelection[]>([]);
  
  // State for filter conditions (simple format for backward compatibility)
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  
  // State for advanced filter conditions
  const [advancedFilterConditions, setAdvancedFilterConditions] = useState<AdvancedFilterCondition[]>([]);
  
  // State for sort items
  const [sortItems, setSortItems] = useState<SortItem[]>([]);
  
  // State for limit value
  const [limitValue, setLimitValue] = useState<string>('');
  
  // State for generated SOQL query
  const [generatedQuery, setGeneratedQuery] = useState<string>('');
  
  // Load metadata
  const metadata = mockSalesforceMetadata;
  
  // Toast for notifications
  const { toast } = useToast();
  
  // Function to generate WHERE clause from advanced conditions
  const generateWhereClause = (conditions: AdvancedFilterCondition[], isSubGroup = false): string => {
    if (!conditions || conditions.length === 0) return '';
    
    let result = '';
    
    conditions.forEach((condition, index) => {
      // Add logical operator for conditions after the first one
      if (index > 0) {
        result += ` ${condition.logicalOperator} `;
      }
      
      // Handle nested groups
      if (condition.isGroup && condition.conditions && condition.conditions.length > 0) {
        const nestedClause = generateWhereClause(condition.conditions, true);
        if (nestedClause) {
          result += `(${nestedClause})`;
        }
      } else if (condition.field && condition.operator && condition.value) {
        // Handle regular conditions
        result += `${condition.field} ${condition.operator} ${condition.value}`;
      }
    });
    
    return result;
  };
  
  // Update the query whenever any of the parts change
  useEffect(() => {
    if (!selectedObject) {
      setGeneratedQuery('');
      return;
    }
    
    // Build the query
    let query = 'SELECT ';
    
    // Add selected fields
    if (selectedFields.length === 0) {
      query += 'Id';
    } else {
      query += selectedFields.map(field => field.apiName).join(', ');
    }
    
    // Add FROM clause
    query += `\nFROM ${selectedObject}`;
    
    // Add WHERE clause if filters exist
    if (advancedFilterConditions.length > 0) {
      query += '\nWHERE ';
      query += generateWhereClause(advancedFilterConditions);
    } else if (filterConditions.length > 0) {
      // Fallback to simple conditions for backward compatibility
      query += '\nWHERE ';
      query += filterConditions.map((condition, index) => {
        let filterStr = '';
        if (index > 0) {
          filterStr += ' AND ';
        }
        filterStr += `${condition.field} ${condition.operator} ${condition.value}`;
        return filterStr;
      }).join('');
    }
    
    // Add ORDER BY clause if sort items exist
    if (sortItems.length > 0) {
      query += '\nORDER BY ';
      query += sortItems.map(item => `${item.field} ${item.direction}`).join(', ');
    }
    
    // Add LIMIT clause if set
    if (limitValue) {
      query += `\nLIMIT ${limitValue}`;
    }
    
    setGeneratedQuery(query);
  }, [selectedObject, selectedFields, filterConditions, advancedFilterConditions, sortItems, limitValue]);
  
  // Handle object selection
  const handleObjectSelected = (objectName: string) => {
    setSelectedObject(objectName);
    setSelectedFields([]);
    setFilterConditions([]);
    setAdvancedFilterConditions([]);
    setSortItems([]);
  };
  
  // Handle adding a field
  const handleAddField = (field: FieldSelection) => {
    setSelectedFields(prev => [...prev, field]);
  };
  
  // Handle removing a field
  const handleRemoveField = (index: number) => {
    setSelectedFields(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle adding a filter condition (simple format)
  const handleAddFilterCondition = (condition: FilterCondition) => {
    setFilterConditions(prev => [...prev, condition]);
  };
  
  // Handle removing a filter condition (simple format)
  const handleRemoveFilterCondition = (index: number) => {
    setFilterConditions(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle updating all advanced filter conditions
  const handleUpdateAdvancedFilterConditions = (conditions: AdvancedFilterCondition[]) => {
    setAdvancedFilterConditions(conditions);
  };
  
  // Handle adding a sort item
  const handleAddSortItem = (sort: SortItem) => {
    setSortItems(prev => [...prev, sort]);
  };
  
  // Handle removing a sort item
  const handleRemoveSortItem = (index: number) => {
    setSortItems(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle limit change
  const handleLimitChange = (value: string) => {
    setLimitValue(value);
  };
  
  // Handle executing the query
  const handleExecuteQuery = () => {
    onExecuteQuery(generatedQuery);
  };
  
  // Handle copying query to clipboard
  const handleCopyQuery = () => {
    navigator.clipboard.writeText(generatedQuery);
    toast({
      title: "Copied to clipboard",
      description: "The SOQL query has been copied to your clipboard."
    });
  };
  
  // Handle saving a query
  const handleSaveQuery = () => {
    // In a real implementation, this would save to the database
    // Here we'll just demonstrate the concept with localStorage
    try {
      const existingQueries = localStorage.getItem('savedSoqlQueries');
      const queries: SavedQuery[] = existingQueries ? JSON.parse(existingQueries) : [];
      
      const newQuery: SavedQuery = {
        id: Date.now().toString(),
        name: `Query on ${selectedObject}`,
        query: generatedQuery,
        createdAt: new Date().toISOString(),
        object: selectedObject
      };
      
      queries.push(newQuery);
      localStorage.setItem('savedSoqlQueries', JSON.stringify(queries));
      
      toast({
        title: "Query saved",
        description: "Your query has been saved for future use."
      });
    } catch (error) {
      console.error("Error saving query:", error);
      toast({
        title: "Error saving query",
        description: "There was an error saving your query. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex flex-col p-4 space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Object Selection */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Build Your SOQL Query</h3>
          <p className="text-muted-foreground mb-4">
            Create complex Salesforce queries using the visual query builder
          </p>
          
          <FromSelector 
            metadata={metadata}
            selectedObject={selectedObject}
            onObjectSelected={handleObjectSelected}
          />
        </div>
        
        {selectedObject && (
          <>
            <Accordion type="multiple" defaultValue={['fields', 'conditions']} className="w-full">
              {/* Fields Selection */}
              <AccordionItem value="fields">
                <AccordionTrigger>Fields (SELECT)</AccordionTrigger>
                <AccordionContent>
                  <SelectFields
                    metadata={metadata}
                    selectedObject={selectedObject}
                    selectedFields={selectedFields}
                    onAddField={handleAddField}
                    onRemoveField={handleRemoveField}
                  />
                </AccordionContent>
              </AccordionItem>
              
              {/* Filter Conditions */}
              <AccordionItem value="conditions">
                <AccordionTrigger>Filter Conditions (WHERE)</AccordionTrigger>
                <AccordionContent>
                  <WhereFilterBlock
                    metadata={metadata}
                    selectedObject={selectedObject}
                    filterConditions={filterConditions}
                    onAddFilterCondition={handleAddFilterCondition}
                    onRemoveFilterCondition={handleRemoveFilterCondition}
                    onUpdateFilterConditions={handleUpdateAdvancedFilterConditions}
                  />
                </AccordionContent>
              </AccordionItem>
              
              {/* Sort Order */}
              <AccordionItem value="sort">
                <AccordionTrigger>Sort Order (ORDER BY)</AccordionTrigger>
                <AccordionContent>
                  <OrderByBlock
                    metadata={metadata}
                    selectedObject={selectedObject}
                    sortItems={sortItems}
                    onAddSortItem={handleAddSortItem}
                    onRemoveSortItem={handleRemoveSortItem}
                  />
                </AccordionContent>
              </AccordionItem>
              
              {/* Record Limit */}
              <AccordionItem value="limit">
                <AccordionTrigger>Record Limit (LIMIT)</AccordionTrigger>
                <AccordionContent>
                  <LimitBlock
                    limitValue={limitValue}
                    onLimitChange={handleLimitChange}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-semibold">Generated SOQL Query</h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyQuery}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSaveQuery}
                      className="flex items-center gap-1"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>
                </div>
                <QueryPreview query={generatedQuery} />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleExecuteQuery}
                  disabled={!generatedQuery}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Execute Query
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}