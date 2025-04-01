import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import OrgContext from "@/components/org-context";
import FilterBar from "@/components/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SalesforceOrg } from "@shared/schema";
import { Loader2, Download, Share2, Shield, Users, Lock, Key, UserCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function SecurityPage() {
  const [location, setLocation] = useLocation();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>("System Administrator");
  const [activeTab, setActiveTab] = useState("profiles");
  const { toast } = useToast();

  const { data: orgs, isLoading } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
  });

  // Extract org ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const orgId = params.get("org");
    if (orgId) {
      setSelectedOrgId(parseInt(orgId));
    }
  }, [location]);

  // Set the first org as selected if none is selected and orgs are loaded
  useEffect(() => {
    if (!selectedOrgId && orgs && orgs.length > 0) {
      const activeOrg = orgs.find(org => org.isActive) || orgs[0];
      setSelectedOrgId(activeOrg.id);
    } else if (orgs && orgs.length === 0) {
      // Redirect to organizations page if no orgs are connected
      setLocation("/organizations?action=connect");
    }
  }, [orgs, selectedOrgId, setLocation]);

  const handleOrgChange = (orgId: number) => {
    setSelectedOrgId(orgId);
    setLocation(`/security?org=${orgId}`);
  };

  const handleSearch = (term: string) => {
    toast({
      title: "Search applied",
      description: `Filtering security objects for "${term}"`,
    });
  };

  const handleTypeFilter = (type: string) => {
    toast({
      title: "Type filter applied",
      description: `Showing ${type === 'all' ? 'all types' : type}`,
    });
  };

  const handleProfileFilter = (profile: string) => {
    setSelectedProfile(profile);
    toast({
      title: "Profile selected",
      description: `Showing permissions for ${profile}`,
    });
  };

  // Mock data for security visualization
  // In a real app, this would come from the API
  const profilePermissions = {
    "System Administrator": {
      objects: [
        { name: "Account", permissions: ["read", "create", "edit", "delete", "viewAll"] },
        { name: "Contact", permissions: ["read", "create", "edit", "delete", "viewAll"] },
        { name: "Opportunity", permissions: ["read", "create", "edit", "delete", "viewAll"] },
        { name: "Case", permissions: ["read", "create", "edit", "delete", "viewAll"] },
        { name: "Campaign", permissions: ["read", "create", "edit"] },
        { name: "Lead", permissions: ["read", "create", "edit", "delete", "viewAll"] },
        { name: "Custom__c", permissions: ["read"] },
      ]
    },
    "Standard User": {
      objects: [
        { name: "Account", permissions: ["read", "create", "edit"] },
        { name: "Contact", permissions: ["read", "create", "edit"] },
        { name: "Opportunity", permissions: ["read", "create", "edit"] },
        { name: "Case", permissions: ["read", "create"] },
        { name: "Campaign", permissions: ["read"] },
        { name: "Lead", permissions: ["read", "create", "edit"] },
        { name: "Custom__c", permissions: [] },
      ]
    },
    "Sales User": {
      objects: [
        { name: "Account", permissions: ["read", "create", "edit"] },
        { name: "Contact", permissions: ["read", "create", "edit"] },
        { name: "Opportunity", permissions: ["read", "create", "edit", "delete"] },
        { name: "Case", permissions: ["read"] },
        { name: "Campaign", permissions: ["read"] },
        { name: "Lead", permissions: ["read", "create", "edit", "delete"] },
        { name: "Custom__c", permissions: [] },
      ]
    },
    "Custom: Marketing": {
      objects: [
        { name: "Account", permissions: ["read"] },
        { name: "Contact", permissions: ["read"] },
        { name: "Opportunity", permissions: ["read"] },
        { name: "Case", permissions: [] },
        { name: "Campaign", permissions: ["read", "create", "edit", "delete"] },
        { name: "Lead", permissions: ["read", "create", "edit"] },
        { name: "Custom__c", permissions: ["read"] },
      ]
    }
  };

  const getAccessClass = (objectName: string, permission: string) => {
    // @ts-ignore - mock data structure
    const hasPermission = profilePermissions[selectedProfile]?.objects
      .find(obj => obj.name === objectName)
      ?.permissions.includes(permission);

    if (hasPermission) {
      return "bg-emerald-500 text-white";
    }
    return "bg-neutral-200 text-neutral-500";
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
          {selectedOrgId && (
            <>
              <OrgContext orgId={selectedOrgId} onOrgChange={handleOrgChange} />
              
              <FilterBar 
                onSearch={handleSearch}
                onTypeFilter={handleTypeFilter}
                onProfileFilter={handleProfileFilter}
              />
              
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Security & Access Analyzer</CardTitle>
                    <CardDescription>Analyze and optimize security configurations</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Select defaultValue={selectedProfile} onValueChange={setSelectedProfile}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select profile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="System Administrator">System Administrator</SelectItem>
                        <SelectItem value="Standard User">Standard User</SelectItem>
                        <SelectItem value="Sales User">Sales User</SelectItem>
                        <SelectItem value="Custom: Marketing">Custom: Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="profiles" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="profiles" className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Profiles
                      </TabsTrigger>
                      <TabsTrigger value="permissionSets" className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Permission Sets
                      </TabsTrigger>
                      <TabsTrigger value="sharingRules" className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        Sharing Rules
                      </TabsTrigger>
                      <TabsTrigger value="fieldSecurity" className="flex items-center">
                        <Key className="h-4 w-4 mr-2" />
                        Field Security
                      </TabsTrigger>
                      <TabsTrigger value="userAccess" className="flex items-center">
                        <UserCheck className="h-4 w-4 mr-2" />
                        User Access
                      </TabsTrigger>
                      <TabsTrigger value="report" className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Security Report
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profiles" className="mt-0">
                      <div className="border border-neutral-200 rounded-md bg-white p-4">
                        <div className="mb-3 flex justify-between items-center">
                          <h4 className="text-sm font-medium text-neutral-700">
                            Object Permissions ({selectedProfile})
                          </h4>
                          <div className="flex space-x-1 text-xs text-neutral-500">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded bg-emerald-500 mr-1"></div>
                              <span>Full Access</span>
                            </div>
                            <div className="flex items-center ml-2">
                              <div className="w-3 h-3 rounded bg-secondary-400 mr-1"></div>
                              <span>Read/Write</span>
                            </div>
                            <div className="flex items-center ml-2">
                              <div className="w-3 h-3 rounded bg-primary-300 mr-1"></div>
                              <span>Read Only</span>
                            </div>
                            <div className="flex items-center ml-2">
                              <div className="w-3 h-3 rounded bg-neutral-200 mr-1"></div>
                              <span>No Access</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-6 gap-2 text-xs">
                          <div className="col-span-6 grid grid-cols-6 gap-2 bg-neutral-50 py-2 px-2 rounded-md mb-2">
                            <div className="font-bold text-right">Object</div>
                            <div className="text-center font-medium">Read</div>
                            <div className="text-center font-medium">Create</div>
                            <div className="text-center font-medium">Edit</div>
                            <div className="text-center font-medium">Delete</div>
                            <div className="text-center font-medium">View All</div>
                          </div>
                          
                          {/* @ts-ignore - mock data structure */}
                          {profilePermissions[selectedProfile]?.objects.map((object) => (
                            <React.Fragment key={object.name}>
                              <div className="font-medium text-right pt-2">{object.name}</div>
                              <div className={`text-center py-2 rounded ${getAccessClass(object.name, "read")}`}>Read</div>
                              <div className={`text-center py-2 rounded ${getAccessClass(object.name, "create")}`}>Create</div>
                              <div className={`text-center py-2 rounded ${getAccessClass(object.name, "edit")}`}>Edit</div>
                              <div className={`text-center py-2 rounded ${getAccessClass(object.name, "delete")}`}>Delete</div>
                              <div className={`text-center py-2 rounded ${getAccessClass(object.name, "viewAll")}`}>View All</div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="permissionSets" className="mt-0">
                      <div className="border border-neutral-200 rounded-md bg-white p-6 h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <Shield className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-500">Permission Sets analysis coming soon</p>
                          <p className="text-sm text-neutral-400 mt-1">This feature will visualize permission sets and their assignments</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="sharingRules" className="mt-0">
                      <div className="border border-neutral-200 rounded-md bg-white p-6 h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-500">Sharing Rules analysis coming soon</p>
                          <p className="text-sm text-neutral-400 mt-1">This feature will visualize sharing rules and their impact</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="fieldSecurity" className="mt-0">
                      <div className="border border-neutral-200 rounded-md bg-white p-6 h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <Key className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-500">Field-level Security analysis coming soon</p>
                          <p className="text-sm text-neutral-400 mt-1">This feature will visualize field-level security settings</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="userAccess" className="mt-0">
                      <div className="border border-neutral-200 rounded-md bg-white p-6 h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <UserCheck className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-500">User Access simulation coming soon</p>
                          <p className="text-sm text-neutral-400 mt-1">This feature will allow you to simulate user access to records</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="report" className="mt-0">
                      <div className="border border-neutral-200 rounded-md bg-white p-6 h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <FileText className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-500">Security Report coming soon</p>
                          <p className="text-sm text-neutral-400 mt-1">This feature will generate comprehensive security reports</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
