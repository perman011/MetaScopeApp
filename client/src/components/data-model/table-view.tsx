import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FieldMetadata {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  referenceTo?: string | string[];
  relationshipName?: string;
  precision?: number;
  scale?: number;
  length?: number;
  picklistValues?: Array<{ label: string; value: string; }>;
  defaultValue?: any;
  description?: string;
  isCustom?: boolean;
}

interface RelationshipMetadata {
  name: string;
  field?: string;
  object: string;
  type: 'Lookup' | 'MasterDetail' | 'SelfJoin' | 'ManyToMany';
  childObject?: string;
  childField?: string;
}

interface ObjectData {
  name: string;
  label: string;
  apiName?: string;
  fields: FieldMetadata[];
  relationships: RelationshipMetadata[];
  isCustom?: boolean;
}

interface ObjectMetadata {
  objects: ObjectData[];
}

interface TableViewProps {
  metadata: ObjectMetadata;
}

export default function TableView({ metadata }: TableViewProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Get the most connected object for each object
  const getMostConnectedObject = (obj: ObjectData): string => {
    if (!obj.relationships || obj.relationships.length === 0) {
      return "None";
    }
    
    // Count occurrences of each related object
    const relatedObjects = new Map<string, number>();
    obj.relationships.forEach(rel => {
      const object = rel.object;
      relatedObjects.set(object, (relatedObjects.get(object) || 0) + 1);
    });
    
    // Find the object with the most relationships
    let mostConnected = "";
    let maxCount = 0;
    relatedObjects.forEach((count, object) => {
      if (count > maxCount) {
        maxCount = count;
        mostConnected = object;
      }
    });
    
    return mostConnected || "None";
  };
  
  // Filter objects based on search term
  const filteredObjects = metadata.objects.filter(obj => 
    obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obj.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="p-4">
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search objects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Object Name</TableHead>
              <TableHead className="font-semibold">API Name</TableHead>
              <TableHead className="font-semibold">Field Count</TableHead>
              <TableHead className="font-semibold">Custom?</TableHead>
              <TableHead className="font-semibold">Most Connected Object</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredObjects.map((obj) => (
              <TableRow key={obj.name} className="hover:bg-gray-50">
                <TableCell className="font-medium">{obj.label}</TableCell>
                <TableCell>{obj.name}</TableCell>
                <TableCell>{obj.fields.length}</TableCell>
                <TableCell>
                  {obj.isCustom ? (
                    <Badge variant="secondary">✓</Badge>
                  ) : (
                    <Badge variant="outline">✗</Badge>
                  )}
                </TableCell>
                <TableCell>{getMostConnectedObject(obj)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {filteredObjects.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No objects found matching your search.
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 text-right">
        Showing {filteredObjects.length} of {metadata.objects.length} objects
      </div>
    </div>
  );
}