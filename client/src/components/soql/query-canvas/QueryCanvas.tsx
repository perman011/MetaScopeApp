import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import FromSelector from './FromSelector';
import SelectFields from './SelectFields';
import WhereFilterBlock from './WhereFilterBlock';
import OrderByBlock from './OrderByBlock';
import LimitBlock from './LimitBlock';
import QueryPreview from './QueryPreview';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { mockSalesforceMetadata } from '@/lib/mock-data';

// Types
export interface FieldSelection {
  apiName: string;
  relationshipName?: string;
  isRelationship?: boolean;
  parentObjectApiName?: string;
}

export interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

export interface SortItem {
  field: string;
  direction: 'ASC' | 'DESC';
}

interface QueryCanvasProps {
  onExecuteQuery: (query: string) => void;
}

export default function QueryCanvas({ onExecuteQuery }: QueryCanvasProps) {
  // State for selected object
  const [selectedObject, setSelectedObject] = useState<string>('');
  
  // State for selected fields
  const [selectedFields, setSelectedFields] = useState<FieldSelection[]>([]);
  
  // State for filter conditions
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  
  // State for sort items
  const [sortItems, setSortItems] = useState<SortItem[]>([]);
  
  // State for limit value
  const [limitValue, setLimitValue] = useState<string>('');
  
  // State for generated SOQL query
  const [generatedQuery, setGeneratedQuery] = useState<string>('');
  
  // Load metadata
  const metadata = mockSalesforceMetadata;
  
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
    if (filterConditions.length > 0) {
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
  }, [selectedObject, selectedFields, filterConditions, sortItems, limitValue]);
  
  // Handle object selection
  const handleObjectSelected = (objectName: string) => {
    setSelectedObject(objectName);
    setSelectedFields([]);
    setFilterConditions([]);
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
  
  // Handle adding a filter condition
  const handleAddFilterCondition = (condition: FilterCondition) => {
    setFilterConditions(prev => [...prev, condition]);
  };
  
  // Handle removing a filter condition
  const handleRemoveFilterCondition = (index: number) => {
    setFilterConditions(prev => prev.filter((_, i) => i !== index));
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
                <h3 className="text-md font-semibold mb-2">Generated SOQL Query</h3>
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