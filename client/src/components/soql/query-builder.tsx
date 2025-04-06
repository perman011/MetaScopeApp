import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, X } from 'lucide-react';
import { useOrg } from '@/hooks/use-org';
import { mockSalesforceMetadata } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

interface QueryBuilderProps {
  onExecuteQuery: (query: string) => void;
}

// Interface for metadata objects
interface SalesforceObject {
  name: string;
  label: string;
  custom: boolean;
  fields: SalesforceField[];
}

interface SalesforceField {
  name: string;
  label: string;
  type: string;
  required: boolean;
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
  const { activeOrg } = useOrg();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showStandardObjects, setShowStandardObjects] = useState(true);
  const [showCustomObjects, setShowCustomObjects] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [orgMetadata, setOrgMetadata] = useState<any>(null);
  
  // Query building state
  const [selectedObject, setSelectedObject] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [sortItems, setSortItems] = useState<SortItem[]>([]);
  const [limitValue, setLimitValue] = useState('');
  const [queryPreview, setQueryPreview] = useState('');
  
  // Fetch metadata from the org if available, otherwise use mock data
  useEffect(() => {
    if (activeOrg) {
      fetchOrgMetadata();
    }
  }, [activeOrg]);
  
  const fetchOrgMetadata = async () => {
    try {
      setIsLoading(true);
      // In real implementation, this would call the API to get metadata
      // For now, use mock data
      setOrgMetadata(mockSalesforceMetadata);
    } catch (error) {
      console.error('Error fetching org metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use mock data if no org connected, otherwise use fetched metadata
  const metadata = orgMetadata || mockSalesforceMetadata;
  
  // Get all available objects
  const getFilteredObjects = () => {
    if (!metadata) return [];
    
    return metadata.objects.filter((obj: any) => {
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
    return metadata.objects.find((obj: any) => obj.name === selectedObject);
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
    
    // Start building the SELECT clause
    const selectClause = selectedFields.join(', ');
    
    // Start building the complete query
    let query = `SELECT ${selectClause}\nFROM ${selectedObject}`;
    
    // Handle WHERE clause
    if (filters.length > 0) {
      const whereClause = filters
        .filter(f => f.field && f.operator && f.value)
        .map(f => {
          // Handle special operators like LIKE and IN
          if (f.operator === 'LIKE') {
            return `${f.field} LIKE '%${f.value}%'`;
          } else if (f.operator === 'IN') {
            // Check if the values look like a list of IDs or a list of strings
            if (f.value.includes(',')) {
              const values = f.value.split(',').map(v => {
                const trimmed = v.trim();
                return `'${trimmed}'`;
              }).join(', ');
              return `${f.field} IN (${values})`;
            } else {
              // Single value
              return `${f.field} IN ('${f.value}')`;
            }
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
    
    // Add ORDER BY clause
    if (sortItems.length > 0) {
      const orderByClause = sortItems
        .filter(s => s.field)
        .map(s => `${s.field} ${s.direction}`)
        .join(', ');
      
      if (orderByClause) {
        query += `\nORDER BY ${orderByClause}`;
      }
    }
    
    // Add LIMIT clause
    if (limitValue && !isNaN(Number(limitValue))) {
      query += `\nLIMIT ${limitValue}`;
    }
    
    // Update the query preview
    setQueryPreview(query);
    
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
    <div className="p-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Object Selection */}
            <div>
              <Label className="text-sm font-semibold mb-2">Select Salesforce Object</Label>
              <div className="flex items-center space-x-4 mb-2">
                <Input
                  type="text"
                  placeholder="Search objects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  autoComplete="off"
                  prefix={<Search className="w-4 h-4 text-muted-foreground" />}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="standard-objects"
                    checked={showStandardObjects}
                    onCheckedChange={(checked) => setShowStandardObjects(!!checked)}
                  />
                  <Label htmlFor="standard-objects" className="text-sm">Standard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="custom-objects"
                    checked={showCustomObjects}
                    onCheckedChange={(checked) => setShowCustomObjects(!!checked)}
                  />
                  <Label htmlFor="custom-objects" className="text-sm">Custom</Label>
                </div>
              </div>
              <Select value={selectedObject} onValueChange={setSelectedObject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an object" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredObjects().map((obj: any) => (
                    <SelectItem key={obj.name} value={obj.name}>
                      {obj.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field Selection */}
            {selectedObject && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Select Fields</Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={selectAllFields}>Select All</Button>
                    <Button variant="outline" size="sm" onClick={deselectAllFields}>Deselect All</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                  {getSelectedObjectDetails()?.fields.map((field: any) => (
                    <div key={field.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.name}
                        checked={selectedFields.includes(field.name)}
                        onCheckedChange={() => toggleFieldSelection(field.name)}
                      />
                      <Label htmlFor={field.name} className="text-sm">
                        {field.label} ({field.type})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WHERE Clause Filters */}
            {selectedObject && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Filters (WHERE Clause)</Label>
                  <Button variant="outline" size="sm" onClick={addFilter}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Filter
                  </Button>
                </div>
                {filters.length > 0 ? (
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
                          <SelectTrigger className="w-1/3">
                            <SelectValue placeholder="Field" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSelectedObjectDetails()?.fields.map((field: any) => (
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
                          <SelectTrigger className="w-1/5">
                            <SelectValue placeholder="Operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {operatorOptions.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          className="flex-1"
                          placeholder="Value"
                          value={filter.value}
                          onChange={(e) => {
                            const newFilters = [...filters];
                            newFilters[index].value = e.target.value;
                            setFilters(newFilters);
                          }}
                        />
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeFilter(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No filters added yet</div>
                )}
              </div>
            )}

            {/* ORDER BY Clause */}
            {selectedObject && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Sorting (ORDER BY Clause)</Label>
                  <Button variant="outline" size="sm" onClick={addSortItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Sort
                  </Button>
                </div>
                {sortItems.length > 0 ? (
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
                          <SelectTrigger className="w-2/3">
                            <SelectValue placeholder="Field" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSelectedObjectDetails()?.fields.map((field: any) => (
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
                          <SelectTrigger className="w-1/3">
                            <SelectValue placeholder="Direction" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ASC">Ascending</SelectItem>
                            <SelectItem value="DESC">Descending</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeSortItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No sorting added yet</div>
                )}
              </div>
            )}

            {/* LIMIT Clause */}
            {selectedObject && (
              <div>
                <Label className="text-sm font-semibold mb-2">Limit Results</Label>
                <Input
                  type="number"
                  placeholder="Limit (optional)"
                  value={limitValue}
                  onChange={(e) => setLimitValue(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            {/* Query Preview */}
            {selectedObject && selectedFields.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2">Query Preview</Label>
                <div className="bg-muted p-4 rounded-md whitespace-pre-wrap font-mono text-xs">
                  {generateQuery()}
                </div>
              </div>
            )}

            {/* Execute Query Button */}
            <div>
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