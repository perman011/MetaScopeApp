import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SalesforceOrg } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useOrg } from "@/hooks/use-org";
import { useToast } from "@/hooks/use-toast";
import ConnectSalesforceOrgDialog from "./connect-salesforce-org-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Plus, 
  MoreVertical, 
  Check, 
  Trash2, 
  Edit, 
  RefreshCw,
  CloudOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SalesforceOrgManager() {
  const { activeOrg, setActiveOrg } = useOrg();
  const [orgToDelete, setOrgToDelete] = useState<SalesforceOrg | null>(null);
  const { toast } = useToast();

  // Fetch orgs
  const { data: orgs, isLoading } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
  });

  // Delete org mutation
  const deleteMutation = useMutation({
    mutationFn: async (orgId: number) => {
      await apiRequest("DELETE", `/api/orgs/${orgId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
      if (activeOrg && orgToDelete && activeOrg.id === orgToDelete.id) {
        setActiveOrg(null);
      }
      toast({
        title: "Org removed",
        description: `${orgToDelete?.name} has been removed.`,
      });
      setOrgToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove org",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set active org
  const handleSetActiveOrg = (org: SalesforceOrg) => {
    setActiveOrg(org);
    toast({
      title: `${org.name} activated`,
      description: "This org is now selected for all operations.",
    });
  };

  // Refresh org session
  const refreshMutation = useMutation({
    mutationFn: async (orgId: number) => {
      await apiRequest("POST", `/api/orgs/${orgId}/refresh`);
    },
    onSuccess: () => {
      toast({
        title: "Session refreshed",
        description: "Your Salesforce session has been refreshed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to refresh session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!orgs || orgs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <CloudOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Salesforce orgs connected</h3>
        <p className="text-muted-foreground mb-4">
          Connect a Salesforce org to start analyzing metadata.
        </p>
        <ConnectSalesforceOrgDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Connect Salesforce Org
          </Button>
        </ConnectSalesforceOrgDialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Connected Orgs</h3>
        <ConnectSalesforceOrgDialog>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Connect Org
          </Button>
        </ConnectSalesforceOrgDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orgs.map((org) => (
          <Card 
            key={org.id} 
            className={activeOrg?.id === org.id ? "border-primary" : ""}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  <CardDescription className="truncate max-w-[200px]">
                    {org.instanceUrl}
                  </CardDescription>
                </div>
                {activeOrg?.id === org.id && (
                  <Badge className="bg-primary">Active</Badge>
                )}
              </div>
            </CardHeader>
            <CardFooter className="flex justify-between pt-2">
              {activeOrg?.id === org.id ? (
                <Button variant="outline" size="sm" disabled>
                  <Check className="h-4 w-4 mr-2" />
                  Active
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetActiveOrg(org)}
                >
                  Select Org
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => refreshMutation.mutate(org.id)}
                    disabled={refreshMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Session
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Connection
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setOrgToDelete(org)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!orgToDelete} onOpenChange={() => setOrgToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Salesforce Org</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {orgToDelete?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orgToDelete && deleteMutation.mutate(orgToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}