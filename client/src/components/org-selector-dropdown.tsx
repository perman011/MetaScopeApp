import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SalesforceOrg } from "@shared/schema";
import { useOrg } from "@/hooks/use-org";
import { useToast } from "@/hooks/use-toast";
import ConnectSalesforceOrgDialog from "./connect-salesforce-org-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Cloud, Plus, Check, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrgSelectorDropdown() {
  const { activeOrg, setActiveOrg } = useOrg();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Fetch orgs
  const { data: orgs, isLoading } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
  });

  const handleOrgSelect = (org: SalesforceOrg) => {
    setActiveOrg(org);
    setOpen(false);
    toast({
      title: `${org.name} activated`,
      description: "This org is now selected for all operations.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Cloud className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-9 w-[160px]" />
      </div>
    );
  }

  if (!orgs || orgs.length === 0) {
    return (
      <ConnectSalesforceOrgDialog>
        <Button variant="outline" size="sm" className="h-9">
          <Plus className="h-4 w-4 mr-2" />
          Connect Salesforce Org
        </Button>
      </ConnectSalesforceOrgDialog>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <div className="flex items-center">
            <Cloud className="mr-2 h-4 w-4 text-primary" />
            <span className="truncate max-w-[120px]">
              {activeOrg ? activeOrg.name : "Select an org"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>Salesforce Orgs</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrgSelect(org)}
            className="flex justify-between cursor-pointer"
          >
            <span className="truncate">{org.name}</span>
            {activeOrg?.id === org.id && (
              <Check className="h-4 w-4 text-primary ml-2" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <ConnectSalesforceOrgDialog>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Plus className="h-4 w-4 mr-2" />
            Connect New Org
          </DropdownMenuItem>
        </ConnectSalesforceOrgDialog>
        <DropdownMenuItem
          disabled={!activeOrg}
          className="focus:bg-destructive/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Connection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}