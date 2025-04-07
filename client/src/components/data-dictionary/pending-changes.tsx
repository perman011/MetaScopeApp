import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUpDown, Check, X, Loader2, CalendarDays, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface DataDictionaryChange {
  id: number;
  orgId: number;
  objectApiName: string;
  objectLabel: string;
  fieldApiName: string;
  fieldLabel: string;
  changeType: string;
  oldValue: string | null;
  newValue: string;
  status: string;
  createdAt: string;
  createdBy: number;
  updatedAt: string | null;
  updatedBy: number | null;
  deployedAt: string | null;
  errorMessage: string | null;
}

export const PendingChangesComponent: React.FC<{ orgId: number }> = ({ orgId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChange, setSelectedChange] = useState<DataDictionaryChange | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch pending changes
  const { 
    data: changes = [], 
    isLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['/api/data-dictionary/changes', orgId],
    queryFn: async () => {
      const response = await fetch(`/api/orgs/${orgId}/data-dictionary/changes?status=pending`);
      if (!response.ok) throw new Error('Failed to fetch pending changes');
      return response.json();
    },
    enabled: !!orgId,
  });

  // Handle deploy
  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      const response = await fetch(`/api/orgs/${orgId}/data-dictionary/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deploy changes');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Changes Deployed',
        description: `Successfully deployed ${result.results?.deployedCount || 0} changes`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/data-dictionary/changes', orgId] });
      queryClient.invalidateQueries({ queryKey: ['/api/data-dictionary', orgId] });
    } catch (error) {
      toast({
        title: 'Deployment Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  // Handle sort toggle
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Sort changes
  const sortedChanges = [...changes].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'deployed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Deployed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-neutral-50 text-neutral-700 border-neutral-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // View change details
  const viewChangeDetails = (change: DataDictionaryChange) => {
    setSelectedChange(change);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Pending Changes</h3>
          <p className="text-sm text-neutral-500">Changes awaiting deployment to Salesforce</p>
        </div>
        
        <Button 
          onClick={handleDeploy} 
          disabled={isDeploying || changes.length === 0 || changes.filter((c: DataDictionaryChange) => c.status === 'pending').length === 0}
        >
          {isDeploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Deploy Changes
            </>
          )}
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : sortedChanges.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No pending changes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Object / Field</TableHead>
                    <TableHead>Change Type</TableHead>
                    <TableHead>New Value</TableHead>
                    <TableHead onClick={toggleSortOrder} className="cursor-pointer">
                      <div className="flex items-center">
                        Created
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedChanges.map((change) => (
                    <TableRow key={change.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{change.objectLabel}</div>
                          <div className="text-sm text-neutral-500">{change.fieldLabel}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{change.changeType.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {change.newValue ? change.newValue.substring(0, 50) + (change.newValue.length > 50 ? '...' : '') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-1 text-neutral-400" />
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(change.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewChangeDetails(change)}
                        >
                          <Info className="h-4 w-4" />
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
      
      {/* Change detail dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change Details</DialogTitle>
            <DialogDescription>
              Detailed information about this change
            </DialogDescription>
          </DialogHeader>
          
          {selectedChange && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500">Object</h3>
                  <p>{selectedChange.objectLabel} ({selectedChange.objectApiName})</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500">Field</h3>
                  <p>{selectedChange.fieldLabel} ({selectedChange.fieldApiName})</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500">Change Type</h3>
                  <p className="capitalize">{selectedChange.changeType.replace('_', ' ')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500">Status</h3>
                  <p>{getStatusBadge(selectedChange.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500">Created</h3>
                  <p>{new Date(selectedChange.createdAt).toLocaleString()}</p>
                </div>
                {selectedChange.deployedAt && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-500">Deployed</h3>
                    <p>{new Date(selectedChange.deployedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-500">Previous Value</h3>
                <div className="p-2 bg-neutral-50 rounded min-h-[60px]">
                  {selectedChange.oldValue || <span className="text-neutral-400 italic">No previous value</span>}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-500">New Value</h3>
                <div className="p-2 bg-neutral-50 rounded min-h-[60px]">
                  {selectedChange.newValue || <span className="text-neutral-400 italic">No value</span>}
                </div>
              </div>
              
              {selectedChange.errorMessage && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-red-500">Error</h3>
                  <div className="p-2 bg-red-50 text-red-800 rounded">
                    {selectedChange.errorMessage}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};