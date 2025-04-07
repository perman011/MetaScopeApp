import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Search, Edit, Check, X, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Types
export interface DataDictionaryField {
  id: number;
  orgId: number;
  objectApiName: string;
  objectLabel: string;
  fieldApiName: string;
  fieldLabel: string;
  dataType: string;
  length?: number;
  precision?: number;
  scale?: number;
  required: boolean;
  unique: boolean;
  description?: string;
  helpText?: string;
  referenceTo?: string;
  formula?: string;
  createdAt: string;
  updatedAt: string;
}

export const DataDictionaryComponent: React.FC<{ orgId: number }> = ({ orgId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedObject, setSelectedObject] = useState<string>('');
  const [selectedField, setSelectedField] = useState<DataDictionaryField | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  // Fetch data dictionary fields
  const { 
    data: fields = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['/api/data-dictionary', orgId, selectedObject],
    queryFn: async () => {
      const url = selectedObject 
        ? `/api/orgs/${orgId}/data-dictionary?objects=${selectedObject}` 
        : `/api/orgs/${orgId}/data-dictionary`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data dictionary');
      return response.json();
    },
    enabled: !!orgId,
  });

  // Get unique object names for the filter dropdown
  const objectNames = useMemo(() => {
    const names: string[] = Array.from(new Set(fields.map((field: DataDictionaryField) => field.objectApiName)));
    return names.sort();
  }, [fields]);

  // Filter fields based on search term
  const filteredFields = useMemo(() => {
    if (!searchTerm.trim()) return fields;
    
    const term = searchTerm.toLowerCase().trim();
    return fields.filter((field: DataDictionaryField) => 
      field.objectApiName.toLowerCase().includes(term) ||
      field.objectLabel.toLowerCase().includes(term) ||
      field.fieldApiName.toLowerCase().includes(term) ||
      field.fieldLabel.toLowerCase().includes(term) ||
      (field.description && field.description.toLowerCase().includes(term))
    );
  }, [fields, searchTerm]);

  // Handle field selection
  const handleFieldSelect = (field: DataDictionaryField) => {
    setSelectedField(field);
    setEditedDescription(field.description || '');
    setIsFieldDialogOpen(true);
  };

  // Handle description update
  const handleUpdateDescription = async () => {
    if (!selectedField) return;
    
    try {
      const response = await fetch(`/api/orgs/${orgId}/data-dictionary/${selectedField.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: editedDescription
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update description');
      }
      
      toast({
        title: 'Description Updated',
        description: 'The field description has been updated successfully.',
      });
      
      // Update cache and close dialog
      queryClient.invalidateQueries({ queryKey: ['/api/data-dictionary', orgId] });
      setIsFieldDialogOpen(false);
      setIsEditMode(false);
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            className="pl-9"
            placeholder="Search fields, objects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={selectedObject} onValueChange={setSelectedObject}>
          <SelectTrigger className="w-full sm:w-60">
            <SelectValue placeholder="Filter by object" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Objects</SelectItem>
            {objectNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No fields found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Object</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFields.map((field: DataDictionaryField) => (
                    <TableRow key={`${field.objectApiName}-${field.fieldApiName}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{field.objectLabel}</div>
                          <div className="text-sm text-neutral-500">{field.objectApiName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{field.fieldLabel}</div>
                          <div className="text-sm text-neutral-500">{field.fieldApiName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{field.dataType}</TableCell>
                      <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {field.description || <span className="text-neutral-400 italic">No description</span>}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFieldSelect(field)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Field detail dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Field Details</DialogTitle>
            <DialogDescription>
              View and edit field metadata details
            </DialogDescription>
          </DialogHeader>
          
          {selectedField && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Object</h3>
                  <p>{selectedField.objectLabel} ({selectedField.objectApiName})</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Field</h3>
                  <p>{selectedField.fieldLabel} ({selectedField.fieldApiName})</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Data Type</h3>
                  <p>{selectedField.dataType}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Required</h3>
                  <p>{selectedField.required ? 'Yes' : 'No'}</p>
                </div>
                {selectedField.referenceTo && (
                  <div>
                    <h3 className="font-semibold mb-1">References</h3>
                    <p>{selectedField.referenceTo}</p>
                  </div>
                )}
                {selectedField.formula && (
                  <div className="col-span-2">
                    <h3 className="font-semibold mb-1">Formula</h3>
                    <pre className="bg-neutral-100 p-2 rounded text-sm overflow-x-auto">
                      {selectedField.formula}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Description</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    {isEditMode ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
                
                {isEditMode ? (
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Enter a description for this field"
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="p-2 min-h-[80px] bg-neutral-50 rounded">
                    {selectedField.description || <span className="text-neutral-400 italic">No description provided</span>}
                  </p>
                )}
              </div>
              
              {selectedField.helpText && (
                <div>
                  <h3 className="font-semibold mb-1">Help Text</h3>
                  <p className="p-2 bg-neutral-50 rounded">{selectedField.helpText}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
              Close
            </Button>
            {isEditMode && (
              <Button onClick={handleUpdateDescription}>
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};