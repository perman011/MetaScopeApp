
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [environment, setEnvironment] = useState<"production" | "sandbox">("production");
  const [accessToken, setAccessToken] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [authMethod, setAuthMethod] = useState<"credentials" | "token">("credentials");
  
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { refreshOrgs } = useOrg();

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

  const connectMutation = useMutation({
    mutationFn: async (data: any) => {
      setConnectionStatus('connecting');
      setConnectionError(null);
      
      try {
        console.log('Attempting to connect with:', {
          name: data.name,
          environment: data.environment,
          authMethod: data.authMethod
        });

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
          console.error('Connection error response:', errorData);
          throw new Error(errorData.message || 'Failed to connect to Salesforce org');
        }
        
        const newOrg = await res.json();
        
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
      setTimeout(() => {
        setIsOpen(false);
        refreshOrgs();
        
        toast({
          title: "Connection successful",
          description: `${orgName} has been connected to your account`,
        });
        
        resetForm();
        
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
    setAccessToken("");
    setInstanceUrl("");
    setConnectionStatus('idle');
    setConnectionProgress(0);
    setConnectionError(null);
  };
  
  const handleConnect = () => {
    // Clear any previous errors
    setConnectionError(null);

    const data = {
      name: orgName,
      environment: environment,
      authMethod: authMethod,
    };

    // Validate required fields
    const errors = [];
    if (!orgName) errors.push("Org name is required");

    if (authMethod === 'credentials') {
      if (!orgName || !email || !password) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please provide org name, email, and password.",
        });
        return;
      }
      Object.assign(data, {
        email,
        password,
        securityToken
      });
    } else {
      if (!orgName || !accessToken || !instanceUrl) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please provide org name, access token, and instance URL.",
        });
        return;
      }
      Object.assign(data, {
        accessToken,
        instanceUrl
      });
    }
    
    connectMutation.mutate(data);
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
              Choose how you want to connect to your Salesforce org
            </DialogDescription>
          </DialogHeader>
          
          {connectionStatus === 'idle' ? (
            <>
              <Tabs defaultValue="credentials" onValueChange={(v) => setAuthMethod(v as "credentials" | "token")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="credentials">Email + Password + Token</TabsTrigger>
                  <TabsTrigger value="token">Access Token</TabsTrigger>
                </TabsList>

                <TabsContent value="credentials">
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
                      <p className="text-xs text-muted-foreground">
                        Your security token is sent to your email when you change your password or reset your security token in Salesforce.
                      </p>
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
                </TabsContent>

                <TabsContent value="token">
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
                      <Label htmlFor="instanceUrl">Instance URL</Label>
                      <Input
                        id="instanceUrl"
                        placeholder="https://your-instance.salesforce.com"
                        value={instanceUrl}
                        onChange={(e) => setInstanceUrl(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="accessToken">Access Token</Label>
                      <Input
                        id="accessToken"
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
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
                </TabsContent>
              </Tabs>
              
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
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection failed</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="mb-4">
                      We couldn't connect to your Salesforce org. Please check your credentials and try again.
                    </p>
                    <Button onClick={handleConnect} size="sm">
                      Retry Connection
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {connectionStatus !== 'idle' && (
            <DialogFooter className="mt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
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
