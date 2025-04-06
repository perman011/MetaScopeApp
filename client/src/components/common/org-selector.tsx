import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/hooks/use-org";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

// Form schema for connecting new org with credentials (email + password)
const connectOrgCredentialsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  securityToken: z.string().optional(),
  environment: z.enum(["production", "sandbox"]).default("production"),
  authMethod: z.literal("credentials")
});

// Form schema for connecting new org with token
const connectOrgTokenSchema = z.object({
  name: z.string().min(1, "Name is required"),
  instanceUrl: z.string().min(1, "Instance URL is required")
    .url("Must be a valid URL")
    .startsWith("https://", "URL must start with https://"),
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().optional(),
  environment: z.enum(["production", "sandbox"]).default("production"),
  authMethod: z.literal("token")
});

// Combined schema with discriminated union
const connectOrgSchema = z.discriminatedUnion("authMethod", [
  connectOrgCredentialsSchema,
  connectOrgTokenSchema
]);

type ConnectOrgFormValues = z.infer<typeof connectOrgSchema>;

export default function OrgSelector() {
  const { toast } = useToast();
  // Wrap with try/catch to handle case where OrgContext is not available
  let activeOrg = null;
  let setActiveOrg = (org: any) => {}; // Default no-op function
  
  try {
    const orgContext = useOrg();
    activeOrg = orgContext.activeOrg;
    setActiveOrg = orgContext.setActiveOrg;
  } catch (e) {
    // OrgContext not available
  }
  
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch orgs
  const { data: orgs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/orgs"],
    placeholderData: [],
  });
  
  // State for the current auth method tab
  const [authMethod, setAuthMethod] = useState<"credentials" | "token">("credentials");

  // Set up form for connecting a new org
  const form = useForm<ConnectOrgFormValues>({
    resolver: zodResolver(connectOrgSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      securityToken: "",
      environment: "production",
      authMethod: "credentials",
    },
  });
  
  // Update form values when auth method changes
  const onTabChange = (value: string) => {
    const newAuthMethod = value as "credentials" | "token";
    setAuthMethod(newAuthMethod);
    
    const currentName = form.getValues().name || "";
    const currentEnvironment = form.getValues().environment || "production";
    
    // Reset the form with new defaults based on the auth method
    if (newAuthMethod === "credentials") {
      form.reset({
        name: currentName,
        email: "",
        password: "",
        securityToken: "",
        environment: currentEnvironment,
        authMethod: "credentials"
      } as any); // Use 'as any' to bypass TS checking - we've ensured valid values
    } else {
      form.reset({
        name: currentName,
        instanceUrl: "https://",
        accessToken: "",
        refreshToken: "",
        environment: currentEnvironment,
        authMethod: "token"
      } as any); // Use 'as any' to bypass TS checking - we've ensured valid values
    }
  };
  
  // Connect org mutation
  const connectOrgMutation = useMutation({
    mutationFn: async (data: ConnectOrgFormValues) => {
      const res = await apiRequest("POST", "/api/orgs", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
      setActiveOrg(data);
      setDialogOpen(false);
      toast({
        title: "Connected successfully",
        description: `${data.name} has been connected`,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to connect org",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ConnectOrgFormValues) => {
    connectOrgMutation.mutate(data);
  };
  
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <span>{activeOrg?.name || "Select Org"}</span>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Salesforce Orgs</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {isLoading ? (
              <DropdownMenuItem disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading orgs...
              </DropdownMenuItem>
            ) : orgs && orgs.length > 0 ? (
              orgs.map((org: any) => (
                <DropdownMenuItem 
                  key={org.id} 
                  onClick={() => setActiveOrg(org)}
                  className={activeOrg?.id === org.id ? "bg-primary-50 text-primary-600" : ""}
                >
                  {org.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No orgs connected</DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Connect New Org
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Connect Salesforce Org</DialogTitle>
                <DialogDescription>
                  Choose how you want to connect to your Salesforce org
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="credentials" onValueChange={onTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="credentials">Email + Password + Token</TabsTrigger>
                  <TabsTrigger value="token">Access Token</TabsTrigger>
                </TabsList>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Org Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Production Org" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <TabsContent value="credentials" className="p-0 mt-0">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="you@example.com" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="securityToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Security Token</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                Your security token is sent to your email when you change your password or reset your security token in Salesforce.
                              </p>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="environment"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel>Environment</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
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
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="token" className="p-0 mt-0">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="instanceUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instance URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://yourinstance.salesforce.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="accessToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Access Token</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="refreshToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Refresh Token (Optional)</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="environment"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel>Environment</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="production" id="token-production" />
                                    <Label htmlFor="token-production">Production</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="sandbox" id="token-sandbox" />
                                    <Label htmlFor="token-sandbox">Sandbox</Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    
                    {/* Hidden field for authMethod */}
                    <input 
                      type="hidden" 
                      {...form.register("authMethod")}
                      value={authMethod}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={connectOrgMutation.isPending}
                      >
                        {connectOrgMutation.isPending ? (
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
                </Form>
              </Tabs>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
