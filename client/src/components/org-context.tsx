import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { SalesforceOrg } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { RefreshCw, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface OrgContextProps {
  orgId: number;
  onOrgChange?: (orgId: number) => void;
}

export default function OrgContext({ orgId, onOrgChange }: OrgContextProps) {
  const { toast } = useToast();
  const [lastSyncLabel, setLastSyncLabel] = useState("Never synced");

  const { data: org, isLoading } = useQuery<SalesforceOrg>({
    queryKey: [`/api/orgs/${orgId}`],
    enabled: Boolean(orgId),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/orgs/${orgId}/sync`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${orgId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${orgId}/metadata`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${orgId}/health-scores`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orgs/${orgId}/issues`] });
      toast({
        title: "Sync completed",
        description: "The metadata has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (org?.lastSyncedAt) {
      const lastSyncDate = new Date(org.lastSyncedAt);
      const now = new Date();
      const diffMs = now.getTime() - lastSyncDate.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 60) {
        setLastSyncLabel(`${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`);
      } else {
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) {
          setLastSyncLabel(`${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`);
        } else {
          const diffDays = Math.floor(diffHours / 24);
          setLastSyncLabel(`${diffDays} day${diffDays !== 1 ? 's' : ''} ago`);
        }
      }
    } else {
      setLastSyncLabel("Never synced");
    }
  }, [org]);

  if (isLoading) {
    return (
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40 mb-1" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    );
  }

  if (!org) {
    return null;
  }

  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-neutral-800">{org.name}</h2>
          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            org.type === 'production' 
              ? 'bg-emerald-100 text-emerald-800' 
              : org.type === 'sandbox' 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-neutral-100 text-neutral-800'
          }`}>
            {org.type.charAt(0).toUpperCase() + org.type.slice(1)}
          </span>
        </div>
        <p className="text-sm text-neutral-500 mt-1">{org.domain}</p>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-neutral-500">Last synced: {lastSyncLabel}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? "Syncing..." : "Sync Now"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit Organization</DropdownMenuItem>
            <DropdownMenuItem>Refresh Access Token</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Disconnect Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
