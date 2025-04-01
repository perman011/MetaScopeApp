import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ConnectSalesforceOrgDialogProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function ConnectSalesforceOrgDialog({ 
  children, 
  onSuccess 
}: ConnectSalesforceOrgDialogProps) {
  const [orgName, setOrgName] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("https://");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const connectMutation = useMutation({
    mutationFn: async (orgData: {
      name: string;
      instanceUrl: string;
      accessToken: string;
      refreshToken?: string;
    }) => {
      const response = await apiRequest("POST", "/api/orgs", orgData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
      toast({
        title: "Org connected successfully",
        description: `${orgName} has been connected to your account.`,
      });
      setIsOpen(false);
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to connect org",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setOrgName("");
    setInstanceUrl("https://");
    setAccessToken("");
    setRefreshToken("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!orgName.trim()) {
      return toast({
        title: "Validation error",
        description: "Please enter an org name",
        variant: "destructive",
      });
    }
    
    if (!instanceUrl.trim() || !instanceUrl.startsWith("https://")) {
      return toast({
        title: "Validation error",
        description: "Please enter a valid instance URL",
        variant: "destructive",
      });
    }
    
    if (!accessToken.trim()) {
      return toast({
        title: "Validation error",
        description: "Please enter an access token",
        variant: "destructive",
      });
    }

    connectMutation.mutate({
      name: orgName,
      instanceUrl: instanceUrl,
      accessToken: accessToken,
      refreshToken: refreshToken || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect Salesforce Org</DialogTitle>
            <DialogDescription>
              Enter your Salesforce org credentials to connect
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="orgName" className="text-right">
                Org Name
              </Label>
              <Input
                id="orgName"
                className="col-span-3"
                placeholder="Production Org"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="instanceUrl" className="text-right">
                Instance URL
              </Label>
              <Input
                id="instanceUrl"
                className="col-span-3"
                placeholder="https://myinstance.salesforce.com"
                value={instanceUrl}
                onChange={(e) => setInstanceUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accessToken" className="text-right">
                Access Token
              </Label>
              <Input
                id="accessToken"
                type="password"
                className="col-span-3"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="refreshToken" className="text-right">
                Refresh Token (Optional)
              </Label>
              <Input
                id="refreshToken"
                type="password"
                className="col-span-3"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={connectMutation.isPending}>
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}