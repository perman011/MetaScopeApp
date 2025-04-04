import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X, 
  Plus, 
  Search, 
  ChevronRight, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  ChevronsRight, 
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { FieldSelection } from './QueryCanvas';

interface SelectFieldsProps {
  metadata: any;
  selectedObject: string;
  selectedFields: FieldSelection[];
  onAddField: (field: FieldSelection) => void;
  onRemoveField: (index: number) => void;
}

export default function SelectFields({
  metadata,
  selectedObject,
  selectedFields,
  onAddField,
  onRemoveField
}: SelectFieldsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRelated, setShowRelated] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState('');
  
  // Get the selected object's fields
  const getObjectFields = (objectName: string) => {
    if (!metadata || !objectName) return [];
    const obj = metadata.objects.find((o: any) => o.name === objectName);
    return obj?.fields || [];
  };
  
  // Get relationship fields for the selected object
  const getRelationshipFields = () => {
    const fields = getObjectFields(selectedObject);
    return fields.filter((field: any) => field.type === 'reference' && field.relationshipName);
  };
  
  // Filter fields based on search term
  const filteredFields = getObjectFields(selectedObject).filter((field: any) =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle adding a field
  const handleAddField = (fieldName: string) => {
    // Check if field is already selected
    const isDuplicate = selectedFields.some(f => f.apiName === fieldName);
    if (isDuplicate) return;
    
    onAddField({
      apiName: fieldName,
      isRelationship: false
    });
  };
  
  // Handle adding a relationship field
  const handleAddRelationshipField = (relationshipName: string, fieldName: string) => {
    // The full field name with relationship path
    const fullFieldName = `${relationshipName}.${fieldName}`;
    
    // Check if field is already selected
    const isDuplicate = selectedFields.some(f => f.apiName === fullFieldName);
    if (isDuplicate) return;
    
    onAddField({
      apiName: fullFieldName,
      relationshipName,
      isRelationship: true,
      parentObjectApiName: selectedObject
    });
  };
  
  // Get related object from relationship name
  const getRelatedObjectName = (relationshipName: string) => {
    const fields = getObjectFields(selectedObject);
    const relationshipField = fields.find((field: any) => 
      field.relationshipName === relationshipName
    );
    return relationshipField?.referenceTo[0] || '';
  };
  
  // Get fields for the selected relationship
  const getRelatedObjectFields = () => {
    if (!selectedRelationship) return [];
    const relatedObjectName = getRelatedObjectName(selectedRelationship);
    return getObjectFields(relatedObjectName);
  };
  
  // Group similar fields by type for better organization
  const groupFieldsByType = (fields: any[]) => {
    const groups: { [key: string]: any[] } = {
      'Standard': [],
      'Identification': [],
      'Dates': [],
      'Relationships': [],
      'Custom': [],
      'Other': []
    };
    
    fields.forEach(field => {
      if (field.name === 'Id' || field.name === 'Name' || field.name.endsWith('Id')) {
        groups['Identification'].push(field);
      } else if (field.type === 'date' || field.type === 'datetime' || field.name.includes('Date')) {
        groups['Dates'].push(field);
      } else if (field.type === 'reference' && field.relationshipName) {
        groups['Relationships'].push(field);
      } else if (field.name.endsWith('__c')) {
        groups['Custom'].push(field);
      } else if (field.type === 'string' || field.type === 'picklist' || field.type === 'textarea') {
        groups['Standard'].push(field);
      } else {
        groups['Other'].push(field);
      }
    });
    
    // Only return groups that have fields
    return Object.entries(groups)
      .filter(([_, fields]) => fields.length > 0)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as { [key: string]: any[] });
  };
  
  // Check if a field is already selected
  const isFieldSelected = (fieldName: string, isRelated = false, relationshipPrefix = '') => {
    const fullFieldName = isRelated ? `${relationshipPrefix}.${fieldName}` : fieldName;
    return selectedFields.some(f => f.apiName === fullFieldName);
  };
  
  // Get related objects for parent-to-child relationships
  const getChildObjects = () => {
    if (!metadata || !selectedObject) return [];
    
    return metadata.objects
      .filter((obj: any) => {
        // Look for fields that reference the current object
        return obj.fields.some((field: any) => 
          field.type === 'reference' && 
          field.referenceTo && 
          field.referenceTo.includes(selectedObject)
        );
      })
      .map((obj: any) => {
        // Find the field that creates the relationship
        const relationshipField = obj.fields.find((field: any) => 
          field.type === 'reference' && 
          field.referenceTo && 
          field.referenceTo.includes(selectedObject)
        );
        
        return {
          name: obj.name,
          label: obj.label,
          relationshipName: relationshipField?.relationshipName || '',
          childRelationshipName: `${obj.name}s`, // This is a simplified assumption; in real SF it would need to be derived from the API
          isChildRelationship: true
        };
      });
  };
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="direct">
        <TabsList className="w-full">
          <TabsTrigger value="direct" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Direct Fields
          </TabsTrigger>
          <TabsTrigger value="parent" className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Parent-to-Child
          </TabsTrigger>
          <TabsTrigger value="child" className="flex-1">
            <ArrowRight className="h-4 w-4 mr-2" />
            Child-to-Parent
          </TabsTrigger>
        </TabsList>
        
        {/* Direct fields tab */}
        <TabsContent value="direct" className="pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Fields for {selectedObject}</CardTitle>
              <CardDescription>
                Select fields directly from the {selectedObject} object
              </CardDescription>
              <div className="relative mt-2">
                <Input
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(groupFieldsByType(filteredFields)).map(([groupName, fields]) => (
                <div key={groupName} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{groupName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fields.map((field: any) => {
                      const isSelected = isFieldSelected(field.name);
                      return (
                        <div
                          key={field.name}
                          className={cn(
                            "flex items-center justify-between py-2 px-3 rounded-md cursor-pointer border",
                            isSelected 
                              ? "bg-primary/10 border-primary/20" 
                              : "hover:bg-muted/50 border-transparent hover:border-muted"
                          )}
                          onClick={() => !isSelected && handleAddField(field.name)}
                        >
                          <div className="flex items-center">
                            <span className="text-sm">{field.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">({field.name})</span>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Parent to Child Relationships tab */}
        <TabsContent value="parent" className="pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Parent-to-Child Relationships</CardTitle>
              <CardDescription>
                Access child records related to this {selectedObject}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getChildObjects().length > 0 ? (
                <div className="space-y-4">
                  {getChildObjects().map((childObj: any) => (
                    <div key={childObj.name} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            Child
                          </Badge>
                          <h4 className="text-sm font-medium">{childObj.label}</h4>
                          <span className="text-xs text-muted-foreground">({childObj.name})</span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => {
                            const subqueryName = `(SELECT Id FROM ${childObj.childRelationshipName})`;
                            if (!isFieldSelected(subqueryName)) {
                              onAddField({
                                apiName: subqueryName,
                                isRelationship: true,
                                relationshipName: childObj.childRelationshipName,
                                parentObjectApiName: selectedObject
                              });
                            }
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Subquery
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center">
                        <ChevronsRight className="h-3 w-3 mr-1" />
                        {selectedObject} → {childObj.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  No child relationships found for this object
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Child to Parent Relationships tab */}
        <TabsContent value="child" className="pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Child-to-Parent Relationships</CardTitle>
              <CardDescription>
                Access parent records that this {selectedObject} relates to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRelationshipFields().length > 0 ? (
                  getRelationshipFields().map((field: any) => {
                    const relatedObjectName = field.referenceTo[0] || '';
                    const relatedObject = metadata.objects.find((o: any) => o.name === relatedObjectName);
                    
                    return (
                      <div key={field.relationshipName} className="border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Parent
                            </Badge>
                            <h4 className="text-sm font-medium">{field.label}</h4>
                            <span className="text-xs text-muted-foreground">({field.relationshipName})</span>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRelationship(field.relationshipName)}
                          >
                            View Fields
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center">
                          <ChevronsRight className="h-3 w-3 mr-1" />
                          {selectedObject} → {relatedObject?.label || relatedObjectName}
                        </div>
                        
                        {selectedRelationship === field.relationshipName && (
                          <div className="mt-3 pl-3 border-l-2 border-muted">
                            <div className="relative mb-2">
                              <Input
                                placeholder={`Search ${relatedObject?.label || relatedObjectName} fields...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 text-sm"
                              />
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                              {getRelatedObjectFields()
                                .filter((f: any) => 
                                  f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  f.label.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((relatedField: any) => {
                                  const isSelected = isFieldSelected(relatedField.name, true, field.relationshipName);
                                  return (
                                    <div
                                      key={relatedField.name}
                                      className={cn(
                                        "flex items-center justify-between py-1 px-2 rounded-md cursor-pointer text-sm border",
                                        isSelected 
                                          ? "bg-primary/10 border-primary/20" 
                                          : "hover:bg-muted/50 border-transparent hover:border-muted"
                                      )}
                                      onClick={() => !isSelected && handleAddRelationshipField(field.relationshipName, relatedField.name)}
                                    >
                                      <div className="flex items-center">
                                        <span className="text-sm">{relatedField.label}</span>
                                        <span className="text-xs text-muted-foreground ml-1">({relatedField.name})</span>
                                      </div>
                                      {isSelected ? (
                                        <CheckCircle2 className="h-3 w-3 text-primary" />
                                      ) : (
                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    No parent relationships found for this object
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Selected Fields</h4>
        
        {selectedFields.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3 border border-dashed">
            No fields selected. Default: Id will be selected.
          </div>
        ) : (
          <div className="p-3 border rounded-md bg-muted/10">
            <div className="flex flex-wrap gap-2">
              {selectedFields.map((field, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-3"
                >
                  {field.isRelationship && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-xs">{field.apiName}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 ml-1" 
                    onClick={() => onRemoveField(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {selectedFields.length} field(s) selected
            </div>
          </div>
        )}
      </div>
    </div>
  );
}