import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PendingChange {
  id: number;
  orgId: number;
  objectApiName: string;
  fieldApiName: string;
  fieldId: number;
  changeType: 'update' | 'delete';
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  userId: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
}

export const PendingChangesComponent: React.FC<{ orgId: number }> = ({ orgId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingChanges = [], isLoading } = useQuery({
    queryKey: ['/api/data-dictionary/changes', orgId],
    queryFn: async () => {
      const response = await fetch(`/api/data-dictionary/${orgId}/changes`);
      if (!response.ok) throw new Error('Failed to fetch pending changes');
      return response.json();
    },
    enabled: !!orgId,
  });

  const applyChangesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/data-dictionary/${orgId}/changes/apply`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-dictionary/changes', orgId] });
      queryClient.invalidateQueries({ queryKey: ['/api/data-dictionary', orgId] });
      queryClient.invalidateQueries({ queryKey: ['/api/data-dictionary/audit-log', orgId] });
      toast({
        title: 'Success',
        description: 'Changes have been applied to Salesforce',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to apply changes',
        variant: 'destructive',
      });
    },
  });

  const discardChangeMutation = useMutation({
    mutationFn: async (changeId: number) => {
      return apiRequest('DELETE', `/api/data-dictionary/${orgId}/changes/${changeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-dictionary/changes', orgId] });
      toast({
        title: 'Success',
        description: 'Change has been discarded',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to discard change',
        variant: 'destructive',
      });
    },
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Changes</CardTitle>
        <CardDescription>
          Review and manage pending field metadata changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : pendingChanges.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No pending changes</h3>
            <p className="text-sm text-muted-foreground">
              Edit field descriptions to queue up changes for deployment
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Object</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingChanges.map((change: PendingChange) => (
                  <TableRow key={change.id}>
                    <TableCell>{formatDate(change.createdAt)}</TableCell>
                    <TableCell>{change.objectApiName}</TableCell>
                    <TableCell>{change.fieldApiName}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="text-xs">
                        <div className="line-through text-red-500">{change.oldValue || '(empty)'}</div>
                        <div className="text-green-500">{change.newValue || '(empty)'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => discardChangeMutation.mutate(change.id)}
                        disabled={discardChangeMutation.isPending}
                      >
                        <X className="h-4 w-4 text-red-500 mr-1" />
                        Discard
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {pendingChanges.length > 0 && (
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
            <span className="text-sm text-muted-foreground">
              {pendingChanges.length} pending change{pendingChanges.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Button 
            onClick={() => applyChangesMutation.mutate()}
            disabled={applyChangesMutation.isPending}
          >
            {applyChangesMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Apply to Salesforce
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};