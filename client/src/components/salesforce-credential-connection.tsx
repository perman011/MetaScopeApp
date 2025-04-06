import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface CredentialConnectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SalesforceCredentialConnection({ open, onOpenChange }: CredentialConnectionProps) {
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityToken, setSecurityToken] = useState("");
  const [environment, setEnvironment] = useState<"production" | "sandbox">("production");
  const { toast } = useToast();

  const connectMutation = useMutation({
    mutationFn: async () => {
      console.log("Connecting with credentials:", { 
        name: orgName, 
        email, 
        environment,
        authMethod: "credentials"
      });
      
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: orgName,
          email,
          password,
          securityToken,
          environment,
          authMethod: "credentials"
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to connect to Salesforce org');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
      toast({
        title: "Connection successful",
        description: `${orgName} has been connected to your account`,
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message || "Failed to connect to Salesforce org. Please try again.",
      });
    },
  });

  const resetForm = () => {
    setOrgName("");
    setEmail("");
    setPassword("");
    setSecurityToken("");
    setEnvironment("production");
  };

  const handleConnect = () => {
    if (!orgName || !email || !password) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide org name, email, and password.",
      });
      return;
    }
    
    connectMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Salesforce Org</DialogTitle>
          <DialogDescription>
            Enter your Salesforce org credentials to connect
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="orgName">Org Name</Label>
            <Input
              id="orgName"
              placeholder="Production, Sandbox, Dev Org, etc."
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="securityToken">Security Token</Label>
            <Input
              id="securityToken"
              value={securityToken}
              onChange={(e) => setSecurityToken(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Environment</Label>
            <RadioGroup 
              value={environment} 
              onValueChange={(value) => setEnvironment(value as "production" | "sandbox")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="production" id="production" />
                <Label htmlFor="production">Production</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sandbox" id="sandbox" />
                <Label htmlFor="sandbox">Sandbox</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={connectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={connectMutation.isPending}
          >
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
      </DialogContent>
    </Dialog>
  );
}