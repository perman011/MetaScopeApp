import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: number;
  orgId: number;
  objectApiName: string;
  fieldApiName: string;
  changeType: 'update' | 'delete';
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  appliedAt: string;
  userId: number;
  userName: string;
}

export const AuditLogComponent: React.FC<{ orgId: number }> = ({ orgId }) => {
  const { data: auditLog = [], isLoading } = useQuery({
    queryKey: ['/api/data-dictionary/audit-log', orgId],
    queryFn: async () => {
      const response = await fetch(`/api/data-dictionary/${orgId}/audit-log`);
      if (!response.ok) throw new Error('Failed to fetch audit log');
      return response.json();
    },
    enabled: !!orgId,
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
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>
          Track all changes made to field metadata
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : auditLog.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No audit log entries</h3>
            <p className="text-sm text-muted-foreground">
              Changes to field metadata will be tracked here
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Object</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead className="text-right">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((entry: AuditLogEntry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.appliedAt)}</TableCell>
                    <TableCell>{entry.userName}</TableCell>
                    <TableCell>{entry.objectApiName}</TableCell>
                    <TableCell>{entry.fieldApiName}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="text-xs">
                        <div className="line-through text-red-500">{entry.oldValue || '(empty)'}</div>
                        <div className="text-green-500">{entry.newValue || '(empty)'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={entry.changeType === 'update' ? 'outline' : 'destructive'}>
                        {entry.changeType === 'update' ? 'Update' : 'Delete'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};