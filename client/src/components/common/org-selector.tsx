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

// Form schema for connecting new org
const connectOrgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  instanceUrl: z.string().min(1, "Instance URL is required")
    .url("Must be a valid URL")
    .startsWith("https://", "URL must start with https://"),
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().optional(),
});

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
  
  // Set up form for connecting a new org
  const form = useForm<ConnectOrgFormValues>({
    resolver: zodResolver(connectOrgSchema),
    defaultValues: {
      name: "",
      instanceUrl: "https://",
      accessToken: "",
      refreshToken: "",
    },
  });
  
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
                  Enter your Salesforce org credentials to connect
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
