import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Search, ChevronRight } from 'lucide-react';
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
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowRelated(false)}
          className={!showRelated ? "bg-primary text-primary-foreground" : ""}
        >
          Direct Fields
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowRelated(true)}
          className={showRelated ? "bg-primary text-primary-foreground" : ""}
        >
          Related Fields
        </Button>
      </div>
      
      {showRelated ? (
        // Related fields selection
        <div className="space-y-4">
          <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {getRelationshipFields().map((field: any) => (
                <SelectItem key={field.relationshipName} value={field.relationshipName}>
                  {field.label} ({field.relationshipName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedRelationship && (
            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder="Search related fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                {getRelatedObjectFields()
                  .filter((field: any) => 
                    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    field.label.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((field: any) => (
                    <div
                      key={field.name}
                      className="flex items-center justify-between py-2 px-3 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => handleAddRelationshipField(selectedRelationship, field.name)}
                    >
                      <div className="flex items-center">
                        <span className="text-sm">{field.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">({field.name})</span>
                      </div>
                      <Button size="icon" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Direct fields selection
        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
            {filteredFields.map((field: any) => (
              <div
                key={field.name}
                className="flex items-center justify-between py-2 px-3 hover:bg-muted rounded-md cursor-pointer"
                onClick={() => handleAddField(field.name)}
              >
                <div className="flex items-center">
                  <span className="text-sm">{field.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">({field.name})</span>
                </div>
                <Button size="icon" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Selected Fields</h4>
        
        {selectedFields.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No fields selected. Default: Id will be selected.
          </div>
        ) : (
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
                <span>{field.apiName}</span>
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
        )}
      </div>
    </div>
  );
}