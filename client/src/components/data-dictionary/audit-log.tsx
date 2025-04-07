import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Info, UserCircle, Calendar, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DataDictionaryAuditLog {
  id: number;
  orgId: number;
  userId: number;
  action: string;
  details: any;
  status: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export const AuditLogComponent: React.FC<{ orgId: number }> = ({ orgId }) => {
  const [selectedLog, setSelectedLog] = useState<DataDictionaryAuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch audit logs
  const { 
    data: logs = [], 
    isLoading 
  } = useQuery({
    queryKey: ['/api/data-dictionary/audit-log', orgId],
    queryFn: async () => {
      const response = await fetch(`/api/orgs/${orgId}/data-dictionary/audit-log`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    },
    enabled: !!orgId,
  });

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Sort logs by timestamp
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // View log details
  const viewLogDetails = (log: DataDictionaryAuditLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  // Get formatted action text
  const getActionText = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ');
  };

  // Get action badge
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'edit':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Edit</Badge>;
      case 'deploy':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Deploy</Badge>;
      case 'sync':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Sync</Badge>;
      case 'export':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Export</Badge>;
      case 'import':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Import</Badge>;
      default:
        return <Badge variant="outline">{getActionText(action)}</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Success</Badge>;
      case 'failure':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format details summary
  const getDetailsSummary = (details: any) => {
    if (!details) return 'No details';
    
    if (details.objectCount !== undefined && details.fieldCount !== undefined) {
      return `${details.objectCount} objects, ${details.fieldCount} fields`;
    }
    
    if (details.changesCount !== undefined) {
      return `${details.changesCount} changes`;
    }
    
    if (details.field) {
      return `${details.object}.${details.field}`;
    }
    
    return 'Details available';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Audit Log</h3>
        <p className="text-sm text-neutral-500">Record of all actions performed on the data dictionary</p>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No audit logs available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead onClick={toggleSortOrder} className="cursor-pointer">
                      <div className="flex items-center">
                        Timestamp
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {getDetailsSummary(log.details)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-neutral-400" />
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewLogDetails(log)}
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
      
      {/* Log detail dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this action
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500">Action</h3>
                  <p>{getActionBadge(selectedLog.action)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500">Status</h3>
                  <p>{getStatusBadge(selectedLog.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500">Timestamp</h3>
                  <p>{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500">User</h3>
                  <div className="flex items-center">
                    <UserCircle className="h-4 w-4 mr-1 text-neutral-400" />
                    <span>User ID: {selectedLog.userId}</span>
                  </div>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-500">IP Address</h3>
                    <p>{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 mb-2">Details</h3>
                <div className="p-3 bg-neutral-50 rounded overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
              
              {selectedLog.userAgent && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500 mb-1">User Agent</h3>
                  <p className="text-xs text-neutral-500 break-all">{selectedLog.userAgent}</p>
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