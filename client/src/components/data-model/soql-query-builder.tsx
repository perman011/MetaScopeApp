import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { XCircle, ClipboardCopy, Play, Code, Wand2, RefreshCw, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useOrg } from '@/hooks/use-org';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';

// Define interface for selected field
interface SelectedField {
  objectName: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
}

// Define interface for selected object relationship
interface SelectedRelationship {
  sourceObject: string;
  targetObject: string;
  relationshipName: string;
  relationshipType: string;
}

interface SoqlQueryBuilderProps {
  selectedNode: any | null;
  selectedEdge: any | null;
  onSelectNode: (node: any) => void;
  onSelectEdge: (edge: any) => void;
  metadata: any;
  onClose: () => void;
}

export default function SoqlQueryBuilder({
  selectedNode,
  selectedEdge,
  onSelectNode,
  onSelectEdge,
  metadata,
  onClose
}: SoqlQueryBuilderProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { activeOrg } = useOrg();
  
  // State for selected fields and relationships
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [selectedRelationships, setSelectedRelationships] = useState<SelectedRelationship[]>([]);
  const [rootObject, setRootObject] = useState<string>('');
  const [generatedQuery, setGeneratedQuery] = useState<string>('');
  const [whereClause, setWhereClause] = useState<string>('');
  const [limitValue, setLimitValue] = useState<string>('10');
  const [orderByField, setOrderByField] = useState<string>('');
  const [orderDirection, setOrderDirection] = useState<string>('ASC');
  
  // Effect to add selected node
  useEffect(() => {
    if (selectedNode && selectedNode.data) {
      // If we don't have a root object yet, set it
      if (!rootObject) {
        setRootObject(selectedNode.data('apiName') || selectedNode.data('id'));
      }
      
      // Add node if it's not already in the list
      const objectName = selectedNode.data('apiName') || selectedNode.data('id');
      if (objectName && metadata) {
        // Find the object in metadata
        const objectData = metadata.objects.find((obj: any) => obj.name === objectName);
        if (objectData && objectData.fields && objectData.fields.length > 0) {
          // Add Id field by default
          const idField = objectData.fields.find((f: any) => f.name === 'Id');
          if (idField && !selectedFields.some(f => f.objectName === objectName && f.fieldName === 'Id')) {
            addField(objectName, 'Id', 'ID', 'id');
          }
        }
      }
    }
  }, [selectedNode]);
  
  // Effect to add selected edge (relationship)
  useEffect(() => {
    if (selectedEdge && selectedEdge.data) {
      const sourceNode = selectedEdge.source();
      const targetNode = selectedEdge.target();
      
      if (sourceNode && targetNode) {
        const sourceObject = sourceNode.data('apiName') || sourceNode.data('id');
        const targetObject = targetNode.data('apiName') || targetNode.data('id');
        const relType = selectedEdge.data('type') || 'Lookup';
        
        // Check if relationship already exists
        const existingRel = selectedRelationships.find(
          r => r.sourceObject === sourceObject && r.targetObject === targetObject
        );
        
        if (!existingRel && sourceObject && targetObject) {
          // If we don't have a root object yet, set it to source
          if (!rootObject) {
            setRootObject(sourceObject);
          }
          
          // Generate a relationship name if not available
          const relationshipName = selectedEdge.data('name') || 
            `${targetObject.replace('__c', '')}s`;
          
          // Add the relationship
          addRelationship(sourceObject, targetObject, relationshipName, relType);
        }
      }
    }
  }, [selectedEdge]);
  
  // Function to add a field to the selection
  const addField = (objectName: string, fieldName: string, fieldLabel: string, fieldType: string) => {
    setSelectedFields(prev => {
      // Check if field already exists
      if (prev.some(f => f.objectName === objectName && f.fieldName === fieldName)) {
        return prev;
      }
      
      // Add the field
      return [...prev, { objectName, fieldName, fieldLabel, fieldType }];
    });
  };
  
  // Function to remove a field from the selection
  const removeField = (objectName: string, fieldName: string) => {
    setSelectedFields(prev => 
      prev.filter(f => !(f.objectName === objectName && f.fieldName === fieldName))
    );
  };
  
  // Function to add a relationship
  const addRelationship = (sourceObject: string, targetObject: string, relationshipName: string, relationshipType: string) => {
    setSelectedRelationships(prev => {
      // Check if relationship already exists
      if (prev.some(r => r.sourceObject === sourceObject && r.targetObject === targetObject)) {
        return prev;
      }
      
      // Add the relationship
      return [...prev, { 
        sourceObject, 
        targetObject, 
        relationshipName, 
        relationshipType 
      }];
    });
    
    // Find target object in metadata
    const targetObjectData = metadata.objects.find((obj: any) => obj.name === targetObject);
    if (targetObjectData && targetObjectData.fields && targetObjectData.fields.length > 0) {
      // Add Id field for the related object
      const idField = targetObjectData.fields.find((f: any) => f.name === 'Id');
      if (idField) {
        addField(targetObject, 'Id', 'ID', 'id');
      }
    }
  };
  
  // Function to remove a relationship
  const removeRelationship = (sourceObject: string, targetObject: string) => {
    setSelectedRelationships(prev => 
      prev.filter(r => !(r.sourceObject === sourceObject && r.targetObject === targetObject))
    );
    
    // Also remove all fields associated with the target object
    setSelectedFields(prev => 
      prev.filter(f => f.objectName !== targetObject)
    );
  };
  
  // Function to check if an object is used in the query
  const isObjectUsed = (objectName: string): boolean => {
    return rootObject === objectName || 
      selectedRelationships.some(r => r.sourceObject === objectName || r.targetObject === objectName);
  };
  
  // Function to generate the SOQL query
  const generateSoqlQuery = () => {
    try {
      if (!rootObject) {
        toast({
          title: 'No root object selected',
          description: 'Please select a root object for your query',
          variant: 'destructive'
        });
        return;
      }
      
      if (selectedFields.length === 0) {
        toast({
          title: 'No fields selected',
          description: 'Please select at least one field to include in your query',
          variant: 'destructive'
        });
        return;
      }
      
      // Create a map of objects to their fields
      const objectFieldsMap = new Map<string, string[]>();
      
      // Add root object's fields
      const rootObjectFields = selectedFields
        .filter(f => f.objectName === rootObject)
        .map(f => f.fieldName);
      
      if (rootObjectFields.length > 0) {
        objectFieldsMap.set(rootObject, rootObjectFields);
      }
      
      // Add relationship fields
      selectedRelationships.forEach(rel => {
        const targetObjectFields = selectedFields
          .filter(f => f.objectName === rel.targetObject)
          .map(f => f.fieldName);
        
        if (targetObjectFields.length > 0) {
          objectFieldsMap.set(rel.targetObject, targetObjectFields);
        }
      });
      
      // Construct the SELECT clause
      let selectClause = 'SELECT ';
      
      // Add root object fields
      if (objectFieldsMap.has(rootObject)) {
        selectClause += objectFieldsMap.get(rootObject)!.join(', ');
      }
      
      // Add relationship fields
      selectedRelationships.forEach(rel => {
        if (objectFieldsMap.has(rel.targetObject)) {
          const relFields = objectFieldsMap.get(rel.targetObject)!;
          if (relFields.length > 0) {
            // Add comma if needed
            if (selectClause !== 'SELECT ') {
              selectClause += ', ';
            }
            
            // Add relationship fields
            selectClause += `${rel.relationshipName}.${relFields.join(`, ${rel.relationshipName}.`)}`;
          }
        }
      });
      
      // Construct the FROM clause
      const fromClause = `FROM ${rootObject}`;
      
      // Construct the WHERE clause
      const whereClauseText = whereClause ? `WHERE ${whereClause}` : '';
      
      // Construct the ORDER BY clause
      const orderByClause = orderByField ? `ORDER BY ${orderByField} ${orderDirection}` : '';
      
      // Construct the LIMIT clause
      const limitClause = limitValue ? `LIMIT ${limitValue}` : '';
      
      // Join all clauses
      const query = [
        selectClause,
        fromClause,
        whereClauseText,
        orderByClause,
        limitClause
      ].filter(clause => clause).join('\n');
      
      setGeneratedQuery(query);
      
      toast({
        title: 'Query generated',
        description: 'SOQL query has been generated successfully',
      });
      
    } catch (error) {
      console.error('Error generating SOQL query:', error);
      toast({
        title: 'Error generating query',
        description: 'There was an error generating the SOQL query',
        variant: 'destructive'
      });
    }
  };
  
  // Function to copy query to clipboard
  const copyToClipboard = () => {
    if (generatedQuery) {
      navigator.clipboard.writeText(generatedQuery)
        .then(() => {
          toast({
            title: 'Copied to clipboard',
            description: 'Query copied to clipboard successfully',
          });
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          toast({
            title: 'Failed to copy',
            description: 'Could not copy query to clipboard',
            variant: 'destructive'
          });
        });
    }
  };
  
  // Execute query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      if (!activeOrg) throw new Error("No org selected");
      const res = await apiRequest("POST", `/api/orgs/${activeOrg.id}/query`, { query });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Query executed',
        description: `Retrieved ${data.totalSize} records`,
      });
      
      // Navigate to SOQL editor with the query
      if (activeOrg) {
        navigate(`/soql-editor?org=${activeOrg.id}&query=${encodeURIComponent(generatedQuery)}`);
      }
    },
    onError: (error) => {
      console.error("Error executing query:", error);
      toast({
        title: 'Error executing query',
        description: 'There was an error executing the query',
        variant: 'destructive'
      });
    },
  });
  
  // Function to execute the query
  const executeQuery = () => {
    if (!generatedQuery) {
      toast({
        title: 'No query to execute',
        description: 'Please generate a query first',
        variant: 'destructive'
      });
      return;
    }
    
    if (!activeOrg) {
      toast({
        title: 'No org selected',
        description: 'Please select an organization first',
        variant: 'destructive'
      });
      return;
    }
    
    executeQueryMutation.mutate(generatedQuery);
  };
  
  // Function to open SOQL Editor with the query
  const openInSoqlEditor = () => {
    if (!generatedQuery) {
      toast({
        title: 'No query to open',
        description: 'Please generate a query first',
        variant: 'destructive'
      });
      return;
    }
    
    if (activeOrg) {
      navigate(`/soql-editor?org=${activeOrg.id}&query=${encodeURIComponent(generatedQuery)}`);
    } else {
      navigate(`/soql-editor?query=${encodeURIComponent(generatedQuery)}`);
    }
  };
  
  // Function to reset the query builder
  const resetQueryBuilder = () => {
    setSelectedFields([]);
    setSelectedRelationships([]);
    setRootObject('');
    setGeneratedQuery('');
    setWhereClause('');
    setLimitValue('10');
    setOrderByField('');
    setOrderDirection('ASC');
  };
  
  // Get the object data for a specific object
  const getObjectData = (objectName: string) => {
    if (!metadata || !metadata.objects) return null;
    return metadata.objects.find((obj: any) => obj.name === objectName);
  };
  
  // Get displayable name for a relationship
  const getRelationshipDisplayName = (rel: SelectedRelationship) => {
    const sourceObj = getObjectData(rel.sourceObject);
    const targetObj = getObjectData(rel.targetObject);
    
    const sourceName = sourceObj?.label || rel.sourceObject;
    const targetName = targetObj?.label || rel.targetObject;
    
    return `${sourceName} → ${targetName}`;
  };
  
  return (
    <Card className="w-full h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-5 bg-neutral-50 border-b">
        <div>
          <CardTitle className="text-lg font-medium text-neutral-800">SOQL Query Builder</CardTitle>
          <CardDescription>
            Build SOQL queries from selected objects and relationships
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XCircle className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-62px)] flex flex-col">
        <div className="flex flex-1 min-h-0">
          {/* Left panel: Selected objects and fields */}
          <div className="w-1/2 p-4 border-r overflow-auto">
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Root Object</h3>
              {rootObject ? (
                <Badge variant="secondary" className="text-sm">
                  {rootObject}
                </Badge>
              ) : (
                <div className="text-sm text-neutral-500">
                  No root object selected - click an object in the graph
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Selected Relationships</h3>
              {selectedRelationships.length > 0 ? (
                <div className="space-y-2">
                  {selectedRelationships.map((rel, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-neutral-50 p-2 rounded-md">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{getRelationshipDisplayName(rel)}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {rel.relationshipType}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeRelationship(rel.sourceObject, rel.targetObject)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-neutral-500">
                  No relationships selected - click a relationship line in the graph
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="text-md font-medium mb-2">Selected Fields</h3>
              {selectedFields.length > 0 ? (
                <div className="space-y-2">
                  {/* Group fields by object */}
                  {Array.from(new Set(selectedFields.map(f => f.objectName))).map(objName => {
                    const objFields = selectedFields.filter(f => f.objectName === objName);
                    const objectData = getObjectData(objName);
                    const objectLabel = objectData?.label || objName;
                    
                    return (
                      <div key={objName} className="mb-3">
                        <div className="flex items-center mb-1.5">
                          <Badge variant="secondary" className="mr-1">{objectLabel}</Badge>
                          <span className="text-xs text-neutral-500">({objFields.length} fields)</span>
                        </div>
                        
                        <div className="ml-2 space-y-1">
                          {objFields.map((field, fidx) => (
                            <div key={fidx} className="flex items-center justify-between bg-neutral-50 p-1.5 rounded">
                              <div className="flex items-center">
                                <span className="text-sm">{field.fieldName}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {field.fieldType}
                                </Badge>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeField(field.objectName, field.fieldName)}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-neutral-500">
                  No fields selected
                </div>
              )}
            </div>
          </div>
          
          {/* Right panel: Query builder and preview */}
          <div className="w-1/2 p-4 flex flex-col overflow-hidden">
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Query Options</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="whereClause">WHERE Clause (optional)</Label>
                  <Input
                    id="whereClause"
                    placeholder="e.g., CreatedDate > YESTERDAY"
                    value={whereClause}
                    onChange={(e) => setWhereClause(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="orderByField">ORDER BY (optional)</Label>
                    <Input
                      id="orderByField"
                      placeholder="e.g., CreatedDate"
                      value={orderByField}
                      onChange={(e) => setOrderByField(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="w-24">
                    <Label htmlFor="orderDirection">Direction</Label>
                    <select
                      id="orderDirection"
                      value={orderDirection}
                      onChange={(e) => setOrderDirection(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="ASC">ASC</option>
                      <option value="DESC">DESC</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="limitValue">LIMIT</Label>
                  <Input
                    id="limitValue"
                    type="number"
                    min="1"
                    max="2000"
                    value={limitValue}
                    onChange={(e) => setLimitValue(e.target.value)}
                    className="mt-1 w-24"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-3 flex justify-between">
              <Button onClick={generateSoqlQuery}>
                <Code className="mr-2 h-4 w-4" />
                Generate Query
              </Button>
              
              <div className="space-x-2">
                <Button variant="outline" onClick={resetQueryBuilder}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
            
            <div className="relative flex-1 overflow-hidden flex flex-col">
              <Label htmlFor="generatedQuery" className="mb-1">Generated SOQL Query</Label>
              <div className="relative flex-1">
                <Textarea
                  id="generatedQuery"
                  value={generatedQuery}
                  onChange={(e) => setGeneratedQuery(e.target.value)}
                  placeholder="Your SOQL query will appear here..."
                  className="font-mono text-sm resize-none h-full"
                />
                
                {generatedQuery && (
                  <div className="absolute top-2 right-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {generatedQuery && (
              <div className="mt-3 flex justify-between">
                <Button onClick={executeQuery} disabled={executeQueryMutation.isPending}>
                  {executeQueryMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Execute Query
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={openInSoqlEditor}>
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Open in SOQL Editor
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}