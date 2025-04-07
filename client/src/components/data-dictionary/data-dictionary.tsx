import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Edit, Search, FileText, Info, Lock, HelpCircle } from 'lucide-react';

// Types
interface DataDictionaryField {
  id: number;
  orgId: number;
  objectApiName: string;
  fieldApiName: string;
  label: string;
  dataType: string;
  length: number | null;
  precision: number | null;
  scale: number | null;
  required: boolean;
  externalId: boolean;
  unique: boolean;
  description: string | null;
  userDescription: string | null;
  picklistValues: string[] | null;
  referenceTo: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface UpdateFieldRequest {
  id: number;
  userDescription: string;
}

interface FieldEditFormProps {
  field: DataDictionaryField;
  onSubmit: (values: UpdateFieldRequest) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface FieldInfoProps {
  field: DataDictionaryField;
  onEdit: () => void;
}

const FieldEditForm: React.FC<FieldEditFormProps> = ({ 
  field, 
  onSubmit, 
  onCancel,
  isSubmitting
}) => {
  const [userDescription, setUserDescription] = useState(field.userDescription || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: field.id,
      userDescription,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userDescription">Description</Label>
        <Textarea
          id="userDescription"
          value={userDescription}
          onChange={(e) => setUserDescription(e.target.value)}
          placeholder="Enter a user-friendly description for this field"
          rows={5}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
};

const FieldInfo: React.FC<FieldInfoProps> = ({ field, onEdit }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">API Name</h4>
          <p>{field.fieldApiName}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Label</h4>
          <p>{field.label}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Data Type</h4>
          <p>{field.dataType}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Object</h4>
          <p>{field.objectApiName}</p>
        </div>
        
        {field.length && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Length</h4>
            <p>{field.length}</p>
          </div>
        )}
        
        {field.precision !== null && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Precision</h4>
            <p>{field.precision}</p>
          </div>
        )}
        
        {field.scale !== null && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Scale</h4>
            <p>{field.scale}</p>
          </div>
        )}
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Required</h4>
          <p>{field.required ? 'Yes' : 'No'}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">External ID</h4>
          <p>{field.externalId ? 'Yes' : 'No'}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Unique</h4>
          <p>{field.unique ? 'Yes' : 'No'}</p>
        </div>
      </div>
      
      {field.referenceTo && field.referenceTo.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">References To</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {field.referenceTo.map((ref) => (
              <Badge key={ref} variant="outline">{ref}</Badge>
            ))}
          </div>
        </div>
      )}
      
      {field.picklistValues && field.picklistValues.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Picklist Values</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {field.picklistValues.map((value) => (
              <Badge key={value} variant="outline">{value}</Badge>
            ))}
          </div>
        </div>
      )}
      
      <div>
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-muted-foreground">System Description</h4>
        </div>
        <p className="text-sm mt-1">{field.description || 'No system description available'}</p>
      </div>
      
      <div>
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-muted-foreground">User Description</h4>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <p className="text-sm mt-1">{field.userDescription || 'No user description available'}</p>
      </div>
    </div>
  );
};

export const DataDictionaryComponent: React.FC<{ orgId: number }> = ({ orgId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedObject, setSelectedObject] = useState<string>('');
  const [selectedField, setSelectedField] = useState<DataDictionaryField | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);

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
        ? `/api/data-dictionary/${orgId}?objects=${selectedObject}` 
        : `/api/data-dictionary/${orgId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data dictionary');
      return response.json();
    },
    enabled: !!orgId,
  });

  // Get unique object names
  const objectNames = useMemo(() => {
    const names: string[] = Array.from(new Set(fields.map((field: DataDictionaryField) => field.objectApiName)));
    return names.sort();
  }, [fields]);

  // Update field mutation
  const updateField = useMutation({
    mutationFn: async (data: UpdateFieldRequest) => {
      return apiRequest('PATCH', `/api/data-dictionary/${orgId}/field/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-dictionary', orgId] });
      toast({
        title: 'Success',
        description: 'Field description updated successfully',
      });
      setIsEditMode(false);
      setIsFieldDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update field',
        variant: 'destructive',
      });
    },
  });

  // Filter fields based on search term
  const filteredFields = useMemo(() => {
    if (!searchTerm) return fields;
    
    const term = searchTerm.toLowerCase();
    return fields.filter((field: DataDictionaryField) => 
      field.fieldApiName.toLowerCase().includes(term) ||
      field.label.toLowerCase().includes(term) ||
      field.objectApiName.toLowerCase().includes(term) ||
      (field.description?.toLowerCase().includes(term) || false) ||
      (field.userDescription?.toLowerCase().includes(term) || false)
    );
  }, [fields, searchTerm]);

  const handleObjectChange = (value: string) => {
    setSelectedObject(value);
  };

  const handleFieldClick = (field: DataDictionaryField) => {
    setSelectedField(field);
    setIsFieldDialogOpen(true);
    setIsEditMode(false);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleUpdateSubmit = (values: UpdateFieldRequest) => {
    updateField.mutate(values);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Field Metadata</CardTitle>
          <CardDescription>
            View and manage field metadata for your Salesforce org
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedObject} onValueChange={handleObjectChange}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="All Objects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Objects</SelectItem>
                  {objectNames.map((name) => (
                    <SelectItem key={String(name)} value={String(name)}>
                      {String(name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => refetch()}
                      disabled={isLoading || isFetching}
                    >
                      <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh field metadata</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No fields found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Try a different search term' : 'No fields available for this selection'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Object</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-[100px]">Required</TableHead>
                    <TableHead className="text-right">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFields.map((field: DataDictionaryField) => (
                    <TableRow 
                      key={`${field.objectApiName}.${field.fieldApiName}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleFieldClick(field)}
                    >
                      <TableCell className="font-medium">{field.fieldApiName}</TableCell>
                      <TableCell>{field.label}</TableCell>
                      <TableCell>{field.objectApiName}</TableCell>
                      <TableCell>{field.dataType}</TableCell>
                      <TableCell>
                        {field.required ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Lock className="h-4 w-4 text-red-500" />
                              </TooltipTrigger>
                              <TooltipContent>Required field</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">Optional</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {field.userDescription ? (
                          <Badge variant="secondary">User Defined</Badge>
                        ) : field.description ? (
                          <Badge variant="outline">System</Badge>
                        ) : (
                          <Badge variant="outline">None</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedField?.label} ({selectedField?.fieldApiName})
            </DialogTitle>
            <DialogDescription>
              View and edit field metadata information
            </DialogDescription>
          </DialogHeader>
          
          {selectedField && (
            <>
              {isEditMode ? (
                <FieldEditForm
                  field={selectedField}
                  onSubmit={handleUpdateSubmit}
                  onCancel={() => setIsEditMode(false)}
                  isSubmitting={updateField.isPending}
                />
              ) : (
                <FieldInfo
                  field={selectedField}
                  onEdit={handleEditClick}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};