import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalesforceOrg } from "@shared/schema";
import { Loader2, Plus, ChevronRight, Database, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SalesforceCredentialConnection from "@/components/salesforce-credential-connection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const connectOrgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  domain: z.string().min(1, "Domain is required"),
  type: z.enum(["production", "sandbox", "developer", "scratch"]),
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().optional(),
});

type ConnectOrgValues = z.infer<typeof connectOrgSchema>;

export default function OrganizationsPage() {
  const [location, setLocation] = useLocation();
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: orgs, isLoading } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
  });

  const form = useForm<ConnectOrgValues>({
    resolver: zodResolver(connectOrgSchema),
    defaultValues: {
      name: "",
      domain: "",
      type: "production",
      accessToken: "",
      refreshToken: "",
    },
  });

  // Extract action from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const action = params.get("action");
    if (action === "connect") {
      setIsConnectDialogOpen(true);
    }
  }, [location]);

  const connectOrgMutation = useMutation({
    mutationFn: async (data: ConnectOrgValues) => {
      const res = await apiRequest("POST", "/api/orgs", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
      toast({
        title: "Organization connected",
        description: "Your Salesforce organization has been connected successfully.",
      });
      setIsConnectDialogOpen(false);
      form.reset();
      // Remove action=connect from URL
      setLocation("/organizations");
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncOrgMutation = useMutation({
    mutationFn: async (orgId: number) => {
      const res = await apiRequest("POST", `/api/orgs/${orgId}/sync`);
      return await res.json();
    },
    onSuccess: (_, orgId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
      toast({
        title: "Sync initiated",
        description: "Metadata sync has been started. This may take a few minutes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ConnectOrgValues) => {
    connectOrgMutation.mutate(values);
  };

  const handleSyncOrg = (orgId: number) => {
    syncOrgMutation.mutate(orgId);
  };

  const handleViewOrg = (orgId: number) => {
    setLocation(`/dashboard?org=${orgId}`);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Never";
    if (dateString instanceof Date) {
      return dateString.toLocaleString();
    }
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary-500 mb-4" />
              <p className="text-neutral-500">Loading organizations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 lg:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">Connected Organizations</h1>
              <p className="text-neutral-500 mt-1">Manage your connected Salesforce organizations</p>
            </div>
            <Button onClick={() => setIsConnectDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect New Org
            </Button>
          </div>
          
          {/* Connected Orgs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgs?.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No organizations connected</h3>
                  <p className="text-neutral-500 mb-6">Connect your first Salesforce organization to get started</p>
                  <Button onClick={() => setIsConnectDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Organization
                  </Button>
                </CardContent>
              </Card>
            ) : (
              orgs?.map((org) => (
                <Card key={org.id} className={org.isActive ? "border-primary-200" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          (org.type || 'unknown') === 'production' ? 'bg-emerald-500' : 
                          (org.type || 'unknown') === 'sandbox' ? 'bg-amber-500' : 
                          'bg-neutral-400'
                        }`} />
                        <CardTitle>{org.name}</CardTitle>
                      </div>
                      <div className="px-2 py-1 text-xs font-medium rounded bg-neutral-100 text-neutral-800">
                        {(org.type || 'unknown').charAt(0).toUpperCase() + (org.type || 'unknown').slice(1)}
                      </div>
                    </div>
                    <CardDescription className="truncate">
                      {org.domain}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Instance URL:</span>
                        <span className="font-mono text-xs truncate max-w-[150px]">{org.instanceUrl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Last synced:</span>
                        <span>{formatDate(org.lastSyncedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Status:</span>
                        <span className="flex items-center">
                          {org.isActive ? (
                            <span className="text-emerald-500 flex items-center">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span>
                              Active
                            </span>
                          ) : (
                            <span className="text-neutral-500 flex items-center">
                              <span className="w-2 h-2 bg-neutral-400 rounded-full mr-1"></span>
                              Inactive
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSyncOrg(org.id)}
                      disabled={syncOrgMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncOrgMutation.isPending ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleViewOrg(org.id)}
                    >
                      View
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
          
          {/* Salesforce Credential Connection Dialog */}
          <SalesforceCredentialConnection 
            open={isConnectDialogOpen}
            onOpenChange={setIsConnectDialogOpen}
          />
        </main>
      </div>
      <Footer />
    </div>
  );
}
