import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CredentialConnectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ConnectionStatus = 'idle' | 'connecting' | 'success' | 'error';

export default function SalesforceCredentialConnection({ open, onOpenChange }: CredentialConnectionProps) {
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityToken, setSecurityToken] = useState("");
  const [environment, setEnvironment] = useState<"production" | "sandbox">("production");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const connectMutation = useMutation({
    mutationFn: async () => {
      setConnectionStatus('connecting');
      setConnectionError(null);
      
      console.log("Connecting with credentials:", { 
        name: orgName, 
        email, 
        environment,
        authMethod: "credentials"
      });
      
      try {
        const res = await fetch('/api/orgs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: orgName,
            email, // Directly use email field
            password,
            securityToken,
            environment,
            authMethod: "credentials",
            type: environment
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to connect to Salesforce org');
        }

        setConnectionStatus('success');
        return await res.json();
      } catch (error: any) {
        setConnectionStatus('error');
        setConnectionError(error.message || "Failed to connect to Salesforce org");
        throw error;
      }
    },
    onSuccess: () => {
      // Only close after a short delay to show success state
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
        toast({
          title: "Connection successful",
          description: `${orgName} has been connected to your account`,
        });
        resetForm();
        onOpenChange(false);
      }, 1500);
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
    setConnectionStatus('idle');
    setConnectionError(null);
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
        
        {connectionStatus === 'idle' ? (
          <>
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
          </>
        ) : (
          <div className="py-4">
            {connectionStatus === 'connecting' && (
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                  <h3 className="font-medium">Connecting to Salesforce</h3>
                  <p className="text-sm text-muted-foreground">
                    Authenticating with your credentials...
                  </p>
                </div>
              </div>
            )}
            
            {connectionStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Connection successful!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your Salesforce org is now ready to use.
                </AlertDescription>
              </Alert>
            )}
            
            {connectionStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection failed</AlertTitle>
                <AlertDescription className="mt-2">
                  <p className="mb-4">
                    {connectionError || "We couldn't connect to your Salesforce org. Please check your credentials and try again."}
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setConnectionStatus('idle')} 
                      size="sm"
                      variant="outline"
                    >
                      Back to form
                    </Button>
                    <Button 
                      onClick={handleConnect} 
                      size="sm"
                    >
                      Retry Connection
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}