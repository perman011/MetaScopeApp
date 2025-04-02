import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useOrgContext } from "@/hooks/use-org";
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
import { Loader2, KeyRound, Key, CheckCircle, AlertCircle } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Progress
} from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConnectSalesforceOrgDialogProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

type ConnectionStatus = 'idle' | 'connecting' | 'validating' | 'fetching_metadata' | 'success' | 'error';

export default function ConnectSalesforceOrgDialog({ 
  children, 
  onSuccess 
}: ConnectSalesforceOrgDialogProps) {
  // Token-based auth
  const [orgName, setOrgName] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("https://");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  
  // Credential-based auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityToken, setSecurityToken] = useState("");
  const [environment, setEnvironment] = useState("production"); // or "sandbox"
  
  const [isOpen, setIsOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState("credentials"); // or "token"
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { refetchOrgs } = useOrgContext();
  
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
    } else if (connectionStatus === 'error') {
      setConnectionProgress(100);
    } else {
      setConnectionProgress(0);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [connectionStatus]);

  const connectMutation = useMutation({
    mutationFn: async (orgData: any) => {
      // Set initial connection status
      setConnectionStatus('connecting');
      setConnectionError(null);
      
      try {
        console.log("Connecting org with data:", orgData);
        
        // Simulate connection phases with real API call
        const response = await apiRequest("POST", "/api/orgs", orgData);
        
        // Update to validating phase
        setConnectionStatus('validating');
        
        const result = await response.json();
        console.log("Connection success, received:", result);
        
        // Update to fetching metadata phase
        setConnectionStatus('fetching_metadata');
        
        // Allow UI to show fetching metadata phase for a moment
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Set to success
        setConnectionStatus('success');
        
        return result;
      } catch (error) {
        // Set error status
        setConnectionStatus('error');
        if (error instanceof Error) {
          setConnectionError(error.message);
        } else {
          setConnectionError('An unknown error occurred');
        }
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log("Invalidating queries and refreshing org data");
      
      // Keep success state visible for a moment before closing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
      // Use our manual refetch to ensure UI is updated
      await refetchOrgs();
      
      toast({
        title: "Org connected successfully",
        description: `Your Salesforce org has been connected to your account.`,
      });
      
      // Reset connection state and close dialog
      setConnectionStatus('idle');
      setIsOpen(false);
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      // Toast error message
      toast({
        title: "Failed to connect org",
        description: error.message,
        variant: "destructive",
      });
      
      // Error state is already set in mutationFn
      // Keep the dialog open so user can see error and try again
    },
  });

  const resetForm = () => {
    // Token-based auth
    setOrgName("");
    setInstanceUrl("https://");
    setAccessToken("");
    setRefreshToken("");
    
    // Credential-based auth
    setEmail("");
    setPassword("");
    setSecurityToken("");
    setEnvironment("production");
    
    // Reset connection status
    setConnectionStatus('idle');
    setConnectionError(null);
    setConnectionProgress(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMethod === "token") {
      // Validate token-based auth form
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
        authMethod: "token"
      });
    } else {
      // Validate credential-based auth form
      if (!orgName.trim()) {
        return toast({
          title: "Validation error",
          description: "Please enter an org name",
          variant: "destructive",
        });
      }
      
      if (!email.trim() || !email.includes('@')) {
        return toast({
          title: "Validation error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
      }
      
      if (!password.trim()) {
        return toast({
          title: "Validation error",
          description: "Please enter your password",
          variant: "destructive",
        });
      }

      connectMutation.mutate({
        name: orgName,
        email: email,
        password: password,
        securityToken: securityToken,
        environment: environment,
        authMethod: "credentials"
      });
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form and connection status when dialog is closed
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect Salesforce Org</DialogTitle>
            <DialogDescription>
              Enter your Salesforce org credentials to connect
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={authMethod} onValueChange={setAuthMethod} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials">
                <KeyRound className="h-4 w-4 mr-2" />
                Username/Password
              </TabsTrigger>
              <TabsTrigger value="token">
                <Key className="h-4 w-4 mr-2" />
                Token-based
              </TabsTrigger>
            </TabsList>
            
            {/* Username/Password Authentication */}
            <TabsContent value="credentials" className="mt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="credOrgName" className="text-right">
                    Org Name
                  </Label>
                  <Input
                    id="credOrgName"
                    className="col-span-3"
                    placeholder="Production Org"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="environment" className="text-right">
                    Environment
                  </Label>
                  <Select
                    value={environment}
                    onValueChange={setEnvironment}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="col-span-3"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    className="col-span-3"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="securityToken" className="text-right">
                    Security Token
                  </Label>
                  <Input
                    id="securityToken"
                    type="password"
                    className="col-span-3"
                    value={securityToken}
                    onChange={(e) => setSecurityToken(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Token-based Authentication */}
            <TabsContent value="token" className="mt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tokenOrgName" className="text-right">
                    Org Name
                  </Label>
                  <Input
                    id="tokenOrgName"
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
                    Refresh Token
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
            </TabsContent>
          </Tabs>
          
          {/* Connection Status UI */}
          {connectionStatus !== 'idle' && (
            <div className="mt-6">
              <Progress value={connectionProgress} className="h-2 mb-2" />
              
              {connectionStatus === 'connecting' && (
                <div className="flex items-center text-sm text-neutral-600">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Connecting to Salesforce...</span>
                </div>
              )}
              
              {connectionStatus === 'validating' && (
                <div className="flex items-center text-sm text-neutral-600">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Validating credentials...</span>
                </div>
              )}
              
              {connectionStatus === 'fetching_metadata' && (
                <div className="flex items-center text-sm text-neutral-600">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Fetching metadata...</span>
                </div>
              )}
              
              {connectionStatus === 'success' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
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
                  <AlertDescription>
                    {connectionError || "Failed to connect to Salesforce. Please check your credentials and try again."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  if (connectionStatus === 'error' || connectionStatus === 'success') {
                    resetForm();
                  }
                }}
              >
                {connectionStatus === 'success' ? "Close" : "Cancel"}
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={connectMutation.isPending || connectionStatus === 'success'}
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : connectionStatus === 'error' ? (
                "Try Again"
              ) : connectionStatus === 'success' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Connected
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