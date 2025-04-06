import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOrg } from "@/hooks/use-org";
import { useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type ConnectionStatus = 'idle' | 'connecting' | 'validating' | 'fetching_metadata' | 'success' | 'error';

interface ConnectSalesforceOrgDialogProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function ConnectSalesforceOrgDialog({ 
  children, 
  onSuccess 
}: ConnectSalesforceOrgDialogProps) {
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityToken, setSecurityToken] = useState("");
  const [environment, setEnvironment] = useState("production"); // or "sandbox"
  
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const org = useOrg();
  const refreshOrgs = org.refreshOrgs;
  
  // Update progress bar based on connection status
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (connectionStatus === 'connecting') {
      setConnectionProgress(25);
      timer = setTimeout(() => setConnectionProgress(40), 500);
    } else if (connectionStatus === 'validating') {
      setConnectionProgress(60);
    } else if (connectionStatus === 'fetching_metadata') {
      setConnectionProgress(80);
    } else if (connectionStatus === 'success') {
      setConnectionProgress(100);
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [connectionStatus]);
  
  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async (data: any) => {
      setConnectionStatus('connecting');
      setConnectionError(null);
      
      try {
        const res = await fetch('/api/orgs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to connect to Salesforce org');
        }
        
        const newOrg = await res.json();
        
        // Simulate metadata fetching (would happen on the server in production)
        setConnectionStatus('validating');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setConnectionStatus('fetching_metadata');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setConnectionStatus('success');
        return newOrg;
      } catch (error: any) {
        console.error('Connection error:', error);
        setConnectionStatus('error');
        setConnectionError(error.message || "Failed to connect to Salesforce org");
        throw error;
      }
    },
    onSuccess: () => {
      // Only close after a short delay to show success state
      setTimeout(() => {
        setIsOpen(false);
        refreshOrgs();
        
        toast({
          title: "Connection successful",
          description: `${orgName} has been connected to your account`,
        });
        
        // Reset form
        resetForm();
        
        // Call onSuccess if provided
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: connectionError || "Failed to connect to Salesforce org. Please try again.",
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
    setConnectionProgress(0);
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
    
    connectMutation.mutate({
      name: orgName,
      email: email,
      password: password,
      securityToken: securityToken,
      environment: environment,
      authMethod: "credentials"
    });
  };
  
  const isSubmitDisabled = 
    connectionStatus === 'connecting' || 
    connectionStatus === 'validating' || 
    connectionStatus === 'fetching_metadata';
  
  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                  <Label htmlFor="securityToken">Security Token (if required)</Label>
                  <Input
                    id="securityToken"
                    value={securityToken}
                    onChange={(e) => setSecurityToken(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Environment</Label>
                  <RadioGroup value={environment} onValueChange={setEnvironment}>
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
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConnect}>
                  Connect
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-6">
              <Progress value={connectionProgress} className="mb-4" />
              
              {connectionStatus !== 'error' && (
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {connectionStatus === 'connecting' && "Connecting to Salesforce..."}
                    {connectionStatus === 'validating' && "Validating credentials..."}
                    {connectionStatus === 'fetching_metadata' && "Fetching metadata..."}
                    {connectionStatus === 'success' && "Connection complete!"}
                  </span>
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
                <SalesforceConnectionError 
                  onRetry={() => {
                    // Retry the connection with the same parameters
                    connectMutation.mutate({
                      name: orgName,
                      email: email,
                      password: password,
                      securityToken: securityToken,
                      environment: environment,
                      authMethod: "credentials"
                    });
                  }} 
                />
              )}
            </div>
          )}
          
          {/* Only show footer buttons for non-idle states since idle has its own buttons */}
          {connectionStatus !== 'idle' && (
            <DialogFooter className="mt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  // Only allow closing in error states (idle has its own button)
                  if (connectionStatus === 'error') {
                    setIsOpen(false);
                    resetForm();
                  }
                }}
                disabled={isSubmitDisabled}
              >
                Cancel
              </Button>
              
              {connectionStatus === 'error' && (
                <Button 
                  onClick={() => {
                    // Reset to form state
                    setConnectionStatus('idle');
                    setConnectionProgress(0);
                  }}
                >
                  Back
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Error component
function SalesforceConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Connection failed</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">
          We couldn't connect to your Salesforce org. Please check your credentials and try again.
        </p>
        <Button onClick={onRetry} size="sm">
          Retry Connection
        </Button>
      </AlertDescription>
    </Alert>
  );
}