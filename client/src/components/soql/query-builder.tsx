import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Plus, X } from 'lucide-react';
import { useOrgContext } from '@/hooks/use-org';
import { mockSalesforceMetadata } from '@/lib/mock-data';

interface QueryBuilderProps {
  onExecuteQuery: (query: string) => void;
}

interface FilterItem {
  field: string;
  operator: string;
  value: string;
}

interface SortItem {
  field: string;
  direction: 'ASC' | 'DESC';
}

export default function QueryBuilder({ onExecuteQuery }: QueryBuilderProps) {
  const { activeOrg } = useOrgContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showStandardObjects, setShowStandardObjects] = useState(true);
  const [showCustomObjects, setShowCustomObjects] = useState(true);
  
  // Query building state
  const [selectedObject, setSelectedObject] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [sortItems, setSortItems] = useState<SortItem[]>([]);
  const [limitValue, setLimitValue] = useState('');

  // Use mock data when no org is connected
  const metadata = activeOrg ? null : mockSalesforceMetadata;
  
  // Get all available objects
  const getFilteredObjects = () => {
    if (!metadata) return [];
    
    return metadata.objects.filter(obj => {
      const matchesSearch = !searchQuery || 
        obj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        obj.label.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesType = 
        (obj.custom && showCustomObjects) || 
        (!obj.custom && showStandardObjects);
        
      return matchesSearch && matchesType;
    });
  };
  
  // Get selected object details
  const getSelectedObjectDetails = () => {
    if (!metadata || !selectedObject) return null;
    return metadata.objects.find(obj => obj.name === selectedObject);
  };
  
  // Field operators options
  const operatorOptions = [
    { value: '=', label: '=' },
    { value: '!=', label: '!=' },
    { value: '>', label: '>' },
    { value: '<', label: '<' },
    { value: '>=', label: '>=' },
    { value: '<=', label: '<=' },
    { value: 'LIKE', label: 'LIKE' },
    { value: 'IN', label: 'IN' },
  ];
  
  // Add a new filter
  const addFilter = () => {
    const objectDetails = getSelectedObjectDetails();
    if (!objectDetails || objectDetails.fields.length === 0) return;
    
    setFilters([
      ...filters, 
      { 
        field: objectDetails.fields[0].name,
        operator: '=',
        value: ''
      }
    ]);
  };
  
  // Remove a filter
  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };
  
  // Add a new sort item
  const addSortItem = () => {
    const objectDetails = getSelectedObjectDetails();
    if (!objectDetails || objectDetails.fields.length === 0) return;
    
    setSortItems([
      ...sortItems, 
      { 
        field: objectDetails.fields[0].name,
        direction: 'ASC'
      }
    ]);
  };
  
  // Remove a sort item
  const removeSortItem = (index: number) => {
    setSortItems(sortItems.filter((_, i) => i !== index));
  };
  
  // Toggle field selection
  const toggleFieldSelection = (fieldName: string) => {
    if (selectedFields.includes(fieldName)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldName));
    } else {
      setSelectedFields([...selectedFields, fieldName]);
    }
  };
  
  // Select all fields
  const selectAllFields = () => {
    const objectDetails = getSelectedObjectDetails();
    if (!objectDetails) return;
    
    setSelectedFields(objectDetails.fields.map(f => f.name));
  };
  
  // Deselect all fields
  const deselectAllFields = () => {
    setSelectedFields([]);
  };
  
  // Generate SOQL query
  const generateQuery = () => {
    if (!selectedObject || selectedFields.length === 0) return '';
    
    let query = `SELECT ${selectedFields.join(', ')}\nFROM ${selectedObject}`;
    
    // Add WHERE clause if filters exist
    if (filters.length > 0) {
      const whereClause = filters
        .filter(f => f.field && f.operator && f.value)
        .map(f => {
          // Handle special operators like LIKE and IN
          if (f.operator === 'LIKE') {
            return `${f.field} LIKE '%${f.value}%'`;
          } else if (f.operator === 'IN') {
            // Assume comma-separated values for IN
            const values = f.value.split(',').map(v => `'${v.trim()}'`).join(', ');
            return `${f.field} IN (${values})`;
          }
          
          // Handle numeric values vs string values
          const value = isNaN(Number(f.value)) ? `'${f.value}'` : f.value;
          return `${f.field} ${f.operator} ${value}`;
        })
        .join(' AND ');
      
      if (whereClause) {
        query += `\nWHERE ${whereClause}`;
      }
    }
    
    // Add ORDER BY clause if sort items exist
    if (sortItems.length > 0) {
      const orderByClause = sortItems
        .filter(s => s.field)
        .map(s => `${s.field} ${s.direction}`)
        .join(', ');
      
      if (orderByClause) {
        query += `\nORDER BY ${orderByClause}`;
      }
    }
    
    // Add LIMIT clause if limit is set
    if (limitValue && !isNaN(Number(limitValue))) {
      query += `\nLIMIT ${limitValue}`;
    }
    
    return query;
  };
  
  // Run the query
  const runQuery = () => {
    const query = generateQuery();
    if (query) {
      onExecuteQuery(query);
    }
  };
  
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Controls</h3>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search Objects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="standard-objects" 
                checked={showStandardObjects}
                onCheckedChange={(checked) => setShowStandardObjects(checked as boolean)}
              />
              <Label htmlFor="standard-objects">Standard Objects</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="custom-objects" 
                checked={showCustomObjects}
                onCheckedChange={(checked) => setShowCustomObjects(checked as boolean)}
              />
              <Label htmlFor="custom-objects">Custom Objects</Label>
            </div>
          </div>
        </div>
        
        <div className="h-[calc(100vh-500px)] min-h-[200px] overflow-y-auto border rounded-md p-2">
          {getFilteredObjects().map((obj) => (
            <div 
              key={obj.name}
              className={`p-2 rounded-md mb-2 cursor-pointer hover:bg-neutral-100 ${selectedObject === obj.name ? 'bg-neutral-100' : ''}`}
              onClick={() => setSelectedObject(obj.name)}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{obj.label}</div>
                <Badge variant={obj.custom ? "secondary" : "outline"}>
                  {obj.custom ? "Custom" : "Standard"}
                </Badge>
              </div>
              <div className="text-sm text-neutral-500">{obj.name}</div>
            </div>
          ))}
          
          {getFilteredObjects().length === 0 && (
            <div className="flex items-center justify-center h-full text-neutral-500">
              No objects found
            </div>
          )}
        </div>
      </div>
      
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Query Canvas</h3>
            
            {/* SELECT Block */}
            <div className="p-3 border rounded-md bg-neutral-50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold">SELECT</div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={selectAllFields}
                    disabled={!selectedObject}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={deselectAllFields}
                    disabled={selectedFields.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              {selectedObject ? (
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {getSelectedObjectDetails()?.fields.map(field => (
                    <div 
                      key={field.name}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox 
                        id={`field-${field.name}`}
                        checked={selectedFields.includes(field.name)}
                        onCheckedChange={() => toggleFieldSelection(field.name)}
                      />
                      <Label 
                        htmlFor={`field-${field.name}`}
                        className="cursor-pointer"
                      >
                        {field.label} ({field.name})
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-500 text-sm">
                  Select an object to see available fields
                </div>
              )}
            </div>
            
            {/* FROM Block */}
            <div className="p-3 border rounded-md bg-neutral-50">
              <div className="font-bold mb-2">FROM</div>
              {selectedObject ? (
                <div className="bg-white p-2 rounded border">
                  {getSelectedObjectDetails()?.label} ({selectedObject})
                </div>
              ) : (
                <div className="text-neutral-500 text-sm">
                  Select an object from the list
                </div>
              )}
            </div>
            
            {/* WHERE Block */}
            <div className="p-3 border rounded-md bg-neutral-50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold">WHERE</div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={addFilter}
                  disabled={!selectedObject}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Filter
                </Button>
              </div>
              
              <div className="space-y-2">
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Select 
                      value={filter.field}
                      onValueChange={(value) => {
                        const newFilters = [...filters];
                        newFilters[index].field = value;
                        setFilters(newFilters);
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSelectedObjectDetails()?.fields.map(field => (
                          <SelectItem key={field.name} value={field.name}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={filter.operator}
                      onValueChange={(value) => {
                        const newFilters = [...filters];
                        newFilters[index].operator = value;
                        setFilters(newFilters);
                      }}
                    >
                      <SelectTrigger className="h-8 w-24">
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {operatorOptions.map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input 
                      value={filter.value}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[index].value = e.target.value;
                        setFilters(newFilters);
                      }}
                      placeholder="Value"
                      className="h-8"
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeFilter(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {filters.length === 0 && (
                  <div className="text-neutral-500 text-sm">
                    No filters added
                  </div>
                )}
              </div>
            </div>
            
            {/* ORDER BY Block */}
            <div className="p-3 border rounded-md bg-neutral-50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold">ORDER BY</div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={addSortItem}
                  disabled={!selectedObject}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Sort
                </Button>
              </div>
              
              <div className="space-y-2">
                {sortItems.map((sort, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Select 
                      value={sort.field}
                      onValueChange={(value) => {
                        const newSortItems = [...sortItems];
                        newSortItems[index].field = value;
                        setSortItems(newSortItems);
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSelectedObjectDetails()?.fields.map(field => (
                          <SelectItem key={field.name} value={field.name}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={sort.direction}
                      onValueChange={(value: 'ASC' | 'DESC') => {
                        const newSortItems = [...sortItems];
                        newSortItems[index].direction = value;
                        setSortItems(newSortItems);
                      }}
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASC">Ascending</SelectItem>
                        <SelectItem value="DESC">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeSortItem(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {sortItems.length === 0 && (
                  <div className="text-neutral-500 text-sm">
                    No sorting options added
                  </div>
                )}
              </div>
            </div>
            
            {/* LIMIT Block */}
            <div className="p-3 border rounded-md bg-neutral-50">
              <div className="font-bold mb-2">LIMIT</div>
              <Input 
                type="number"
                value={limitValue}
                onChange={(e) => setLimitValue(e.target.value)}
                placeholder="Enter limit"
                className="h-8"
              />
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                onClick={runQuery}
                disabled={!selectedObject || selectedFields.length === 0}
                className="w-full"
              >
                Run Query
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}